/**
 * Automatische Bewertung aller Aufgabentypen. Deterministische Typen werden
 * hier bewertet, Rechen- und Freitextaufgaben werden an die KI delegiert.
 */
import type {
  Answer,
  ClozeQuestion,
  GradeDetail,
  GradeResult,
  ImageFillQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  NetworkAnswer,
  NetworkDiagramQuestion,
  NetzplanAnswer,
  NetzplanQuestion,
  Question,
  DeviceRef,
  NetworkDevice,
} from '../../../shared/types.js';
import { computeNetzplan } from './netzplan.js';
import { aiGrade } from '../ai/grader.js';

export function roundHalf(v: number) {
  return Math.round(v * 2) / 2;
}

/** Normalisiert Text für den Vergleich: Kleinschreibung, Whitespace, Satzzeichen am Ende, Dezimaltrennzeichen. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.;:!?]+$/g, '')
    .replace(/\s*([\/\-–])\s*/g, '$1')
    .replace(/,/g, '.')
    .replace(/(\d)\.(\d{3})(?!\d)/g, '$1$2')
    .trim();
}

export function textMatches(given: string | undefined, accepted: string[]): boolean {
  if (!given) return false;
  const g = normalize(given);
  if (!g) return false;
  for (const a of accepted) {
    const n = normalize(a);
    if (n === g) return true;
    const ng = parseFloat(g.replace(/[^\d.\-]/g, ''));
    const na = parseFloat(n.replace(/[^\d.\-]/g, ''));
    // Reine Zahlenvergleiche (z. B. "254" vs "254 Hosts")
    if (!isNaN(ng) && !isNaN(na) && /^-?[\d.]+$/.test(n) && Math.abs(ng - na) < 1e-9 && /^-?[\d.]+(\s*[a-zäöü%]+)?$/.test(g)) return true;
  }
  return false;
}

function gradeMultipleChoice(q: MultipleChoiceQuestion, a: Answer | undefined): GradeResult {
  const selected = Array.isArray(a) ? (a as string[]) : [];
  const correct = new Set(q.correct);
  const hits = selected.filter((s) => correct.has(s)).length;
  const wrong = selected.length - hits;
  let points: number;
  if (!q.multi) points = hits === 1 && wrong === 0 ? q.points : 0;
  else points = roundHalf((q.points * Math.max(0, hits - wrong)) / correct.size);
  const details: GradeDetail[] = q.options.map((o) => ({
    key: o.id,
    label: o.text,
    awarded: correct.has(o.id) === selected.includes(o.id) ? 1 : 0,
    max: 1,
    expected: correct.has(o.id) ? 'richtig' : 'falsch',
    given: selected.includes(o.id) ? 'ausgewählt' : '—',
  }));
  return {
    questionId: q.id,
    points,
    maxPoints: q.points,
    details,
    feedback: points === q.points ? 'Richtig.' : selected.length === 0 ? 'Keine Antwort ausgewählt.' : q.multi ? `${hits} richtige und ${wrong} falsche Auswahl(en).` : 'Falsche Antwort.',
  };
}

function gradeMatching(q: MatchingQuestion, a: Answer | undefined): GradeResult {
  const given = (a && typeof a === 'object' && !Array.isArray(a) ? a : {}) as Record<string, string>;
  const rightText = new Map(q.right.map((r) => [r.id, r.text]));
  const details: GradeDetail[] = q.left.map((l) => ({
    key: l.id,
    label: l.text,
    awarded: given[l.id] === q.pairs[l.id] ? 1 : 0,
    max: 1,
    expected: rightText.get(q.pairs[l.id]),
    given: given[l.id] ? rightText.get(given[l.id]) ?? '?' : '—',
  }));
  const hits = details.filter((d) => d.awarded).length;
  const points = roundHalf((q.points * hits) / q.left.length);
  return { questionId: q.id, points, maxPoints: q.points, details, feedback: `${hits} von ${q.left.length} Zuordnungen richtig.` };
}

function gradeBlanks(q: ClozeQuestion | ImageFillQuestion, a: Answer | undefined): GradeResult {
  const given = (a && typeof a === 'object' && !Array.isArray(a) ? a : {}) as Record<string, string>;
  const details: GradeDetail[] = q.blanks.map((b, i) => ({
    key: b.id,
    label: `Lücke ${i + 1}`,
    awarded: textMatches(given[b.id], b.accepted) ? 1 : 0,
    max: 1,
    expected: b.accepted[0],
    given: given[b.id] || '—',
  }));
  const hits = details.filter((d) => d.awarded).length;
  const points = roundHalf((q.points * hits) / q.blanks.length);
  return { questionId: q.id, points, maxPoints: q.points, details, feedback: `${hits} von ${q.blanks.length} Feldern richtig.` };
}

function num(v: unknown): number | undefined {
  if (v === '' || v === undefined || v === null) return undefined;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? undefined : n;
}

function gradeNetzplan(q: NetzplanQuestion, a: Answer | undefined): GradeResult {
  const sol = computeNetzplan(q.activities);
  const ans = (a && typeof a === 'object' && 'nodes' in (a as object) ? a : { nodes: {} }) as NetzplanAnswer;
  const fields = ['FAZ', 'FEZ', 'SAZ', 'SEZ', 'GP', 'FP'] as const;
  const details: GradeDetail[] = [];
  let fieldHits = 0;
  const totalFields = q.activities.length * fields.length + 1; // + Gesamtdauer
  for (const act of q.activities) {
    const n = sol.nodes[act.id];
    const g = ans.nodes?.[act.id] ?? {};
    for (const f of fields) {
      const ok = num(g[f]) === n[f];
      if (ok) fieldHits++;
      details.push({ key: `${act.id}.${f}`, label: `${act.id} ${f}`, awarded: ok ? 1 : 0, max: 1, expected: String(n[f]), given: g[f] === undefined || g[f] === '' ? '—' : String(g[f]) });
    }
  }
  const durOk = num(ans.duration) === sol.duration;
  if (durOk) fieldHits++;
  details.push({ key: 'duration', label: 'Gesamtdauer', awarded: durOk ? 1 : 0, max: 1, expected: String(sol.duration), given: ans.duration === undefined || ans.duration === '' ? '—' : String(ans.duration) });

  const fieldPoints = q.points - q.criticalPathPoints;
  let points = (fieldPoints * fieldHits) / totalFields;

  // Kritischer Pfad: alle Vorgänge müssen korrekt markiert sein (anteilig)
  let cpHits = 0;
  for (const act of q.activities) {
    const marked = !!ans.nodes?.[act.id]?.critical;
    if (marked === sol.nodes[act.id].critical) cpHits++;
  }
  const anyMarked = q.activities.some((act) => ans.nodes?.[act.id]?.critical);
  const cpPoints = anyMarked ? (q.criticalPathPoints * cpHits) / q.activities.length : 0;
  points += cpPoints;
  details.push({
    key: 'critical',
    label: 'Kritischer Pfad',
    awarded: roundHalf(cpPoints),
    max: q.criticalPathPoints,
    expected: sol.criticalPath.join(' → '),
    given: anyMarked ? q.activities.filter((act) => ans.nodes?.[act.id]?.critical).map((x) => x.id).join(' → ') : '—',
  });
  return {
    questionId: q.id,
    points: roundHalf(points),
    maxPoints: q.points,
    details,
    feedback: `${fieldHits} von ${totalFields} Zeitwerten richtig, kritischer Pfad ${cpHits === q.activities.length && anyMarked ? 'richtig' : 'nicht vollständig richtig'}. Gesamtdauer: ${sol.duration} ${q.unit}.`,
  };
}

/* ---------- Netzwerkdiagramm ---------- */
function ipToInt(ip: string): number | null {
  const m = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}
export function isHostInSubnet(ip: string, cidr: string): boolean {
  const [net, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  const ipn = ipToInt(ip);
  const netn = ipToInt(net);
  if (ipn === null || netn === null || isNaN(bits)) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  const network = (netn & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  return (ipn & mask) >>> 0 === network && ipn !== network && ipn !== broadcast;
}

function matchDevices(ref: DeviceRef, devices: NetworkDevice[]): NetworkDevice[] {
  if ('id' in ref) return devices.filter((d) => d.id === ref.id);
  return devices.filter((d) => d.type === ref.type);
}

function gradeNetwork(q: NetworkDiagramQuestion, a: Answer | undefined): GradeResult {
  const ans = (a && typeof a === 'object' && 'devices' in (a as object) ? a : { devices: q.devices, links: q.links }) as NetworkAnswer;
  const devices = ans.devices ?? [];
  const links = ans.links ?? [];
  const linked = (x: string, y: string) => links.some((l) => (l.a === x && l.b === y) || (l.a === y && l.b === x));
  const details: GradeDetail[] = [];
  let points = 0;
  for (const [i, r] of q.rules.entries()) {
    let ok = false;
    let given = '';
    const rule = r.rule;
    switch (rule.kind) {
      case 'device_exists': {
        const n = devices.filter((d) => d.type === rule.type).length;
        ok = n >= (rule.min ?? 1) && (rule.max === undefined || n <= rule.max);
        given = `${n} × ${rule.type}`;
        break;
      }
      case 'link_exists':
      case 'link_absent': {
        const A = matchDevices(rule.a, devices);
        const B = matchDevices(rule.b, devices);
        const exists = A.some((x) => B.some((y) => x.id !== y.id && linked(x.id, y.id)));
        ok = rule.kind === 'link_exists' ? exists : !exists;
        given = exists ? 'Verbindung vorhanden' : 'keine Verbindung';
        break;
      }
      case 'ip': {
        const d = devices.find((x) => x.id === rule.deviceId);
        const ip = (d?.ipValue ?? '').trim();
        given = ip || '—';
        if (ip) {
          ok = true;
          if (rule.accepted && !rule.accepted.some((x) => x.trim() === ip)) ok = false;
          if (rule.inSubnet && !isHostInSubnet(ip, rule.inSubnet)) ok = false;
          if (rule.exclude && rule.exclude.includes(ip)) ok = false;
          if (rule.uniqueAmong) {
            const others = rule.uniqueAmong.filter((id) => id !== rule.deviceId).map((id) => devices.find((x) => x.id === id)?.ipValue?.trim());
            if (others.includes(ip)) ok = false;
          }
        }
        break;
      }
    }
    if (ok) points += r.points;
    details.push({ key: `rule${i}`, label: r.description, awarded: ok ? r.points : 0, max: r.points, given });
  }
  const hits = details.filter((d) => d.awarded > 0).length;
  return { questionId: q.id, points: roundHalf(points), maxPoints: q.points, details, feedback: `${hits} von ${q.rules.length} Anforderungen erfüllt.` };
}

/** Bewertet eine Frage. Rechen-/Freitextaufgaben nutzen die KI (asynchron). */
export async function gradeQuestion(q: Question, a: Answer | undefined): Promise<GradeResult> {
  switch (q.type) {
    case 'multiple_choice':
      return gradeMultipleChoice(q, a);
    case 'matching':
      return gradeMatching(q, a);
    case 'cloze':
    case 'image_fill':
      return gradeBlanks(q, a);
    case 'netzplan':
      return gradeNetzplan(q, a);
    case 'network_diagram':
      return gradeNetwork(q, a);
    case 'calculation':
    case 'free_text':
      return aiGrade(q, typeof a === 'string' ? a : '');
  }
}
