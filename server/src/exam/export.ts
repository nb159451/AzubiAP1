/**
 * Export einer ausgewerteten Prüfung als Grundlage für einen KI-erstellten Lernplan.
 *
 * Das Format ist bewusst für Sprachmodelle aufgebaut:
 * - eine Aufgabenstellung an die KI ganz oben (was aus den Daten entstehen soll)
 * - Kontext zur Prüfung (Format, Notenschlüssel, Bedeutung der Felder)
 * - Aggregation nach Handlungsschritt und Thema, schwächste Themen zuerst
 * - je Aufgabe: Aufgabe, Antwort des Prüflings, Musterlösung, verlorene Teilpunkte, Prüferfeedback
 *   (vollständig richtige Aufgaben nur als Einzeiler, um Tokens zu sparen)
 * - Verlauf der bisherigen Versuche (wiederkehrende Schwächen)
 * - ein maschinenlesbarer JSON-Block mit den Kennzahlen
 */
import {
  ihkGrade,
  QUESTION_TYPE_LABELS,
  SECTION_TITLES,
  type Answer,
  type Exam,
  type GradeResult,
  type NetworkAnswer,
  type NetzplanAnswer,
  type Question,
  type Section,
} from '../../../shared/types.js';
import { computeNetzplan } from './netzplan.js';

/* ---------- Eingabe ---------- */

export interface ExportAttempt {
  id: string;
  startedAt: string;
  submittedAt: string | null;
  exam: Exam;
  answers: Record<string, Answer>;
  results: Record<string, GradeResult>;
  score: number;
}

export interface ExportInput {
  /** Der zu exportierende (ausgewertete) Versuch */
  attempt: ExportAttempt;
  /** Frühere ausgewertete Versuche desselben Nutzers, neueste zuerst */
  history: ExportAttempt[];
  /** Anzeigename des Prüflings */
  userName: string;
  /** Version der Prüfungsordnung */
  blueprintVersion: string;
}

/* ---------- Themenbezeichnungen ---------- */

const TOPIC_LABELS: Record<string, string> = {
  netzplantechnik: 'Netzplantechnik (Vorgangsknoten, kritischer Pfad)',
  dsgvo: 'DSGVO / Datenschutzrecht',
  backup: 'Datensicherung (Backup-Strategien)',
  algorithmen: 'Algorithmen und Pseudocode',
  virtualisierung: 'Virtualisierung',
  verschluesselung: 'Verschlüsselung (symmetrisch/asymmetrisch)',
  zahlensysteme: 'Zahlensysteme (Binär, Hex)',
  uml: 'UML-Diagramme',
  'uml-klassendiagramm': 'UML-Klassendiagramm',
  testen: 'Softwaretest',
  subnetting: 'Subnetting (IPv4)',
  vlsm: 'VLSM (Subnetze variabler Länge)',
  osi: 'OSI-Schichtenmodell',
  normalisierung: 'Normalisierung (1.–3. NF)',
  'er-modell': 'ER-Modellierung',
  datenbanken: 'Relationale Datenbanken (Grundlagen)',
  lizenzmodelle: 'Softwarelizenzen',
  ergonomie: 'Ergonomie am Arbeitsplatz',
  dhcp: 'DHCP',
  vorgehensmodelle: 'Vorgehensmodelle (Wasserfall, V-Modell, agil)',
  scrum: 'Scrum',
  vlan: 'VLAN',
  verfuegbarkeit: 'Verfügbarkeit berechnen',
  'thin-client': 'Thin Client / Fat Client',
  'tcp-udp': 'TCP und UDP',
  speichereinheiten: 'Speichereinheiten umrechnen',
  speicherbedarf: 'Speicherbedarf berechnen',
  schreibtischtest: 'Schreibtischtest / Code-Analyse',
  ports: 'Ports und Dienste',
  netzwerksicherheit: 'Netzwerksicherheit',
  netzwerkplanung: 'Netzwerkplanung',
  ki: 'Grundlagen Künstliche Intelligenz',
  ipv6: 'IPv6',
  ipv4: 'IPv4-Adressierung',
  hardware: 'Hardwarekomponenten',
  gewaehrleistung: 'Gewährleistung / Garantie',
  drucker: 'Drucker',
  dmz: 'DMZ',
  cloud: 'Cloud-Modelle (IaaS/PaaS/SaaS)',
  barrierefreiheit: 'Barrierefreiheit',
  authentifizierung: 'Authentifizierung (2FA/MFA)',
  angebotsvergleich: 'Angebotsvergleich / Bezugskalkulation',
  aktivitaetsdiagramm: 'UML-Aktivitätsdiagramm',
  zustandsdiagramm: 'UML-Zustandsdiagramm',
  wlan: 'WLAN',
  wirtschaftlichkeit: 'Wirtschaftlichkeitsrechnung',
  versionsverwaltung: 'Versionsverwaltung (Git)',
  verkabelung: 'Strukturierte Verkabelung',
  uebertragungsmedien: 'Übertragungsmedien',
  uebertragungsdauer: 'Übertragungsdauer berechnen',
  bandbreite: 'Bandbreite / Datenrate',
  tom: 'Technische und organisatorische Maßnahmen (TOM)',
  stundensatz: 'Stundensatz kalkulieren',
  standortvernetzung: 'Standortvernetzung (VPN)',
  stakeholder: 'Stakeholderanalyse',
  software: 'Softwarearten',
  anwendungssoftware: 'Anwendungssoftware (ERP/CRM)',
  'social-engineering': 'Social Engineering',
  'smart-ziele': 'SMART-Ziele',
  schutzziele: 'Schutzziele der IT-Sicherheit',
  schutzbedarf: 'Schutzbedarfsfeststellung',
  schnittstellen: 'Schnittstellen (USB, HDMI, …)',
  protokolle: 'Netzwerkprotokolle',
  projektstrukturplan: 'Projektstrukturplan',
  projektrisiken: 'Projektrisiken',
  projektphasen: 'Projektphasen',
  meilensteine: 'Meilensteine',
  'magisches-dreieck': 'Magisches Dreieck des Projektmanagements',
  passwoerter: 'Passwortsicherheit',
  oop: 'Objektorientierte Programmierung',
  nutzwertanalyse: 'Nutzwertanalyse',
  nat: 'NAT / PAT',
  monitore: 'Monitore / Displays',
  massenspeicher: 'Massenspeicher (SSD/HDD)',
  malware: 'Schadsoftware',
  'make-or-buy': 'Make or Buy',
  lastenheft: 'Lastenheft / Pflichtenheft',
  kryptographie: 'Kryptographie',
  hashing: 'Hashfunktionen',
  hash: 'Hashfunktionen',
  kontrollstrukturen: 'Kontrollstrukturen',
  komponenten: 'Netzwerkkomponenten',
  kommunikation: 'Kommunikation / Präsentation',
  inbetriebnahme: 'Inbetriebnahme / Installation',
  haertung: 'Systemhärtung',
  'green-it': 'Green IT',
  energiekosten: 'Energiekosten berechnen',
  domaene: 'Domänenintegration (Active Directory)',
  datentypen: 'Datentypen',
  datenschutz: 'Datenschutz',
  codequalitaet: 'Codequalität',
  'break-even': 'Break-even-Analyse',
  bpmn: 'BPMN',
  amortisation: 'Amortisationsrechnung',
};

export function topicLabel(slug: string): string {
  if (TOPIC_LABELS[slug]) return TOPIC_LABELS[slug];
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* ---------- Hilfsfunktionen ---------- */

const SECTIONS: Section[] = ['kundenbedarf', 'arbeitsplatz', 'sicherheit', 'netzwerk', 'entwicklung'];
const sectionNo = (s: Section) => SECTIONS.indexOf(s) + 1;
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));
const pct = (got: number, max: number) => (max > 0 ? Math.round((100 * got) / max) : 0);
const dateDE = (iso: string) => new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' });
const dateISO = (iso: string) => iso.slice(0, 10);

/** Entfernt Markdown-Tabellen-Trennzeichen und Zeilenumbrüche aus Zellentext. */
function cell(s: string | undefined | null): string {
  return (s ?? '—').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim() || '—';
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s;
}

/** Mehrzeiliger Text (kann Markdown-Tabellen enthalten) als eingerücktes Blockzitat unter einem Listenpunkt. */
function quoted(label: string, text: string, max: number): string[] {
  const t = truncate(text.trim(), max);
  if (!t.includes('\n') && t.length < 160) return [`- ${label}: ${t}`];
  return [`- ${label}:`, '', ...t.split('\n').map((l) => '  > ' + l), ''];
}

export type Outcome = 'richtig' | 'teilweise' | 'falsch' | 'nicht bearbeitet';

/** Kennzeichnung, wenn die Punkte nicht von der KI bzw. dem Regelwerk stammen. */
function gradingNote(r: GradeResult | undefined): string {
  if (!r) return '';
  if (r.grader === 'self') return ' — **selbst bewertet** (Punkte vom Prüfling anhand der Musterlösung vergeben)';
  if (r.needsManualReview) return ' — **ohne KI-Bewertung** (nur Endergebnisse geprüft, Lösungsweg nicht bewertet; Punkte eher zu niedrig)';
  return '';
}

function isEmptyAnswer(q: Question, a: Answer | undefined): boolean {
  if (a === undefined || a === null) return true;
  switch (q.type) {
    case 'multiple_choice':
      return !Array.isArray(a) || a.length === 0;
    case 'matching':
    case 'cloze':
    case 'image_fill':
      return typeof a !== 'object' || Object.values(a as Record<string, string>).every((v) => !v || !String(v).trim());
    case 'calculation':
    case 'free_text':
      return typeof a !== 'string' || !a.trim();
    case 'netzplan': {
      const n = (a as NetzplanAnswer).nodes ?? {};
      const dur = (a as NetzplanAnswer).duration;
      const anyNode = Object.values(n).some((node) => Object.values(node).some((v) => v !== '' && v !== undefined && v !== false));
      return !anyNode && (dur === undefined || dur === '');
    }
    case 'network_diagram': {
      const na = a as NetworkAnswer;
      const changedDevices = (na.devices ?? []).length !== q.devices.length || (na.devices ?? []).some((d) => d.ipValue && d.ipValue.trim());
      const changedLinks = (na.links ?? []).length !== q.links.length;
      return !changedDevices && !changedLinks;
    }
  }
}

export function outcomeOf(q: Question, a: Answer | undefined, r: GradeResult | undefined): Outcome {
  if (isEmptyAnswer(q, a)) return 'nicht bearbeitet';
  const p = r?.points ?? 0;
  if (p >= q.points) return 'richtig';
  if (p > 0) return 'teilweise';
  return 'falsch';
}

/* ---------- Darstellung der Antworten je Aufgabentyp ---------- */

function renderAnswerBlock(q: Question, a: Answer | undefined, r: GradeResult | undefined): string[] {
  const out: string[] = [];
  const details = r?.details ?? [];
  switch (q.type) {
    case 'multiple_choice': {
      const sel = new Set(Array.isArray(a) ? (a as string[]) : []);
      const correct = new Set(q.correct);
      out.push(`- Antwortoptionen (${q.multi ? 'Mehrfachauswahl' : 'Einfachauswahl'}):`);
      for (const o of q.options) {
        const mark = correct.has(o.id) ? 'richtig' : 'falsch';
        const chosen = sel.has(o.id) ? 'gewählt' : 'nicht gewählt';
        const ok = correct.has(o.id) === sel.has(o.id);
        out.push(`  - ${ok ? '✓' : '✗'} „${o.text}“ — ${mark}, vom Prüfling ${chosen}`);
      }
      break;
    }
    case 'matching': {
      const given = (a && typeof a === 'object' && !Array.isArray(a) ? a : {}) as Record<string, string>;
      const right = new Map(q.right.map((x) => [x.id, x.text]));
      out.push('- Zuordnungen (Begriff → Antwort des Prüflings | erwartet):');
      for (const l of q.left) {
        const g = given[l.id] ? right.get(given[l.id]) ?? '?' : '—';
        const e = right.get(q.pairs[l.id]) ?? '?';
        const ok = given[l.id] === q.pairs[l.id];
        out.push(`  - ${ok ? '✓' : '✗'} „${l.text}“ → ${ok ? `„${e}“` : `gegeben „${g}“, erwartet „${e}“`}`);
      }
      break;
    }
    case 'cloze':
    case 'image_fill': {
      const given = (a && typeof a === 'object' && !Array.isArray(a) ? a : {}) as Record<string, string>;
      if (q.type === 'cloze') {
        let i = 0;
        const tpl = q.template.replace(/\{\{(\w+)\}\}/g, () => `[Lücke ${++i}]`);
        out.push('- Lückentext:', '', '  > ' + tpl.replace(/\n/g, '\n  > '), '');
      } else {
        out.push('- Ausfüllbild (das Diagramm selbst ist im Export nicht enthalten; die Felder sind unten aufgeführt):');
      }
      out.push('- Felder (Antwort des Prüflings | akzeptierte Lösung):');
      q.blanks.forEach((b, i) => {
        const d = details.find((x) => x.key === b.id);
        const ok = (d?.awarded ?? 0) > 0;
        const hint = 'hint' in b && b.hint ? ` (${b.hint})` : '';
        const opts = b.options ? ` [Auswahl: ${b.options.join(' / ')}]` : '';
        out.push(`  - ${ok ? '✓' : '✗'} Lücke ${i + 1}${hint}${opts}: gegeben „${given[b.id]?.trim() || '—'}“, akzeptiert „${b.accepted.join('“ / „')}“`);
      });
      break;
    }
    case 'calculation':
    case 'free_text': {
      const txt = typeof a === 'string' ? a.trim() : '';
      if (txt) out.push('- Antwort des Prüflings (wörtlich):', '', '  ```text', ...truncate(txt, 4000).split('\n').map((l) => '  ' + l), '  ```');
      else out.push('- Antwort des Prüflings: (keine Antwort)');
      if (q.type === 'calculation' && q.expected.length) {
        out.push('- Erwartete Endergebnisse: ' + q.expected.map((e) => `${e.label} = ${e.value}${e.unit ? ' ' + e.unit : ''}`).join('; '));
      }
      if (details.length) {
        out.push('- Bewertung nach Rubrik:');
        for (const d of details) {
          out.push(`  - ${d.awarded >= d.max ? '✓' : d.awarded > 0 ? '◐' : '✗'} ${d.label}: ${fmt(d.awarded)}/${fmt(d.max)} P${d.comment ? ` — ${d.comment}` : ''}`);
        }
      }
      break;
    }
    case 'netzplan': {
      const sol = computeNetzplan(q.activities);
      const ans = (a && typeof a === 'object' && 'nodes' in (a as object) ? a : { nodes: {} }) as NetzplanAnswer;
      out.push(`- Vorgänge (${q.unit}): ` + q.activities.map((x) => `${x.id} „${x.name}“ D=${x.duration}${x.predecessors.length ? ` nach ${x.predecessors.join(',')}` : ''}`).join('; '));
      out.push(`- Musterlösung: Gesamtdauer ${sol.duration} ${q.unit}, kritischer Pfad ${sol.criticalPath.join(' → ')}`);
      out.push(
        '- Musterlösung je Vorgang (FAZ/FEZ/SAZ/SEZ/GP/FP): ' +
          q.activities.map((x) => { const n = sol.nodes[x.id]; return `${x.id}: ${n.FAZ}/${n.FEZ}/${n.SAZ}/${n.SEZ}/${n.GP}/${n.FP}`; }).join('; '),
      );
      const cp = details.find((d) => d.key === 'critical');
      const fields = ['FAZ', 'FEZ', 'SAZ', 'SEZ', 'GP', 'FP'];
      const notes: string[] = [];
      const single: string[] = [];
      for (const f of fields) {
        const ds = q.activities.map((x) => details.find((d) => d.key === `${x.id}.${f}`)).filter((d): d is NonNullable<typeof d> => !!d);
        const wrong = ds.filter((d) => d.awarded < d.max);
        if (!wrong.length) continue;
        const missing = wrong.filter((d) => !d.given || d.given === '—');
        if (wrong.length === ds.length && missing.length === ds.length) notes.push(`${f} bei allen Vorgängen nicht ausgefüllt`);
        else if (wrong.length === ds.length) notes.push(`${f} bei allen Vorgängen falsch oder leer`);
        else single.push(...wrong.map((d) => `${d.label}: gegeben ${d.given ?? '—'}, erwartet ${d.expected ?? '?'}`));
      }
      if (!notes.length && !single.length) out.push('- Alle Zeitwerte richtig.');
      if (notes.length) out.push('- Systematisch fehlend/falsch: ' + notes.join('; '));
      if (single.length) out.push(`- Einzelne falsche oder fehlende Werte (${single.length}): ` + single.join('; '));
      if (cp) out.push(`- Kritischer Pfad: gegeben ${cp.given ?? '—'}, erwartet ${cp.expected} (${fmt(cp.awarded)}/${fmt(cp.max)} P)`);
      const dur = ans.duration;
      out.push(`- Gesamtdauer: gegeben ${dur === undefined || dur === '' ? '—' : dur}, erwartet ${sol.duration}`);
      break;
    }
    case 'network_diagram': {
      out.push('- Anforderungen an den Netzwerkplan (erfüllt / nicht erfüllt):');
      for (const d of details) out.push(`  - ${d.awarded > 0 ? '✓' : '✗'} ${d.label} (${fmt(d.awarded)}/${fmt(d.max)} P)${d.given ? ` — Ist: ${d.given}` : ''}`);
      break;
    }
  }
  return out;
}

/* ---------- Aggregation ---------- */

interface Agg {
  got: number;
  max: number;
  count: number;
}
function addAgg(m: Map<string, Agg>, key: string, got: number, max: number) {
  const a = m.get(key) ?? { got: 0, max: 0, count: 0 };
  a.got += got;
  a.max += max;
  a.count++;
  m.set(key, a);
}

interface TopicRow {
  topic: string;
  label: string;
  section: Section;
  got: number;
  max: number;
  count: number;
  percent: number;
  priority: 'hoch' | 'mittel' | 'niedrig' | 'keine';
}

function priorityOf(got: number, max: number): TopicRow['priority'] {
  const lost = max - got;
  if (lost <= 0) return 'keine';
  const p = got / max;
  if (p < 0.5 && lost >= 2) return 'hoch';
  if (p < 0.5 || lost >= 3) return 'mittel';
  return 'niedrig';
}

function topicRows(attempt: ExportAttempt): TopicRow[] {
  const m = new Map<string, Agg & { section: Section }>();
  for (const s of attempt.exam.sections) {
    for (const q of s.questions) {
      const got = attempt.results[q.id]?.points ?? 0;
      const a = m.get(q.topic) ?? { got: 0, max: 0, count: 0, section: q.section };
      a.got += got;
      a.max += q.points;
      a.count++;
      m.set(q.topic, a);
    }
  }
  return [...m.entries()]
    .map(([topic, a]) => ({ topic, label: topicLabel(topic), section: a.section, got: a.got, max: a.max, count: a.count, percent: pct(a.got, a.max), priority: priorityOf(a.got, a.max) }))
    .sort((x, y) => PRIORITY_RANK[x.priority] - PRIORITY_RANK[y.priority] || y.max - y.got - (x.max - x.got) || x.percent - y.percent || x.label.localeCompare(y.label, 'de'));
}
const PRIORITY_RANK: Record<TopicRow['priority'], number> = { hoch: 0, mittel: 1, niedrig: 2, keine: 3 };

/* ---------- Markdown ---------- */

export function buildLearningExportMarkdown(input: ExportInput): string {
  const { attempt, history, userName } = input;
  const total = attempt.exam.totalPoints;
  const percent = (100 * attempt.score) / total;
  const g = ihkGrade(percent);
  const questions = attempt.exam.sections.flatMap((s) => s.questions);
  const manual = questions.filter((q) => attempt.results[q.id]?.needsManualReview);
  const selfGraded = questions.filter((q) => attempt.results[q.id]?.grader === 'self');
  const aiGraded = questions.filter((q) => attempt.results[q.id]?.aiGraded);
  const minutesUsed = attempt.submittedAt ? Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000) : null;
  const topics = topicRows(attempt);
  const outcomes = new Map(questions.map((q) => [q.id, outcomeOf(q, attempt.answers[q.id], attempt.results[q.id])]));
  const countOutcome = (o: Outcome) => [...outcomes.values()].filter((x) => x === o).length;
  const L: string[] = [];

  L.push(`# AP1-Prüfungsauswertung für einen individuellen Lernplan`);
  L.push('');
  L.push(`> **Anweisung an die KI:** Du bist Ausbilder/in für Fachinformatiker/-innen und bereitest ${userName} auf die IHK-Abschlussprüfung Teil 1 (AP1) vor.`);
  L.push(`> Unten steht die vollständige Auswertung einer Probeprüfung. Erstelle daraus einen konkreten, priorisierten Lernplan.`);
  L.push('>');
  L.push('> Gehe so vor:');
  L.push('> 1. Beginne mit einer kurzen Diagnose: Wo wurden die meisten Punkte verloren, welche Fehlermuster wiederholen sich (auch über frühere Versuche), was ist Wissenslücke, was Flüchtigkeits- oder Methodenfehler?');
  L.push('> 2. Priorisiere Themen nach verlorenen Punkten × Prüfungsrelevanz (Rechen-, Netzplan- und Netzwerkplan-Aufgaben haben in der echten AP1 hohes Gewicht). Themen mit Priorität „hoch“ zuerst, „keine“ nur als Wiederholung.');
  L.push('> 3. Plane pro Thema: Lernziel (überprüfbar), Inhalt/Stichpunkte, empfohlene Übungsform (Rechenwege, Karteikarten, Diagramme zeichnen, Erklärungen formulieren), Zeitbedarf.');
  L.push('> 4. Verteile den Plan auf Wochen bzw. Tage. Wenn der Prüfungstermin oder die verfügbare Lernzeit unbekannt sind, frage danach oder nimm 4 Wochen à 5 Stunden an und sage das ausdrücklich.');
  L.push('> 5. Schließe mit einer Erfolgskontrolle ab (z. B. „nächste Probeprüfung: mindestens X % in HS n“).');
  L.push('>');
  L.push('> Hinweise zu den Daten: „Musterlösung“ ist die Referenz. „Antwort des Prüflings“ ist wörtlich übernommen und kann Rechtschreibfehler enthalten. Rubrik-Kommentare stammen von einer KI-Bewertung. Aufgaben mit Ergebnis „richtig“ sind nur als Einzeiler aufgeführt.');
  if (selfGraded.length) L.push(`> ${selfGraded.length} Aufgabe(n) sind mit „selbst bewertet“ markiert: Dort hat der Prüfling die Punkte anhand der Musterlösung selbst vergeben; Antwort und Musterlösung sind trotzdem enthalten.`);
  if (manual.length) L.push(`> ${manual.length} Aufgabe(n) sind mit „ohne KI-Bewertung“ markiert: Es wurden nur Endergebnisse automatisch geprüft, der Lösungsweg nicht. Beurteile diese Antworten selbst anhand der Musterlösung.`);
  L.push('');

  L.push('## 1. Kontext der Prüfung');
  L.push('');
  L.push('- Prüfung: IHK-Abschlussprüfung Teil 1 „Einrichten eines IT-gestützten Arbeitsplatzes“ (Fachinformatiker/-in Anwendungsentwicklung), simuliert nach dem Prüfungskatalog der ZPA Nord-West, 2. Auflage (gültig ab Frühjahr 2025)');
  L.push(`- Prüfungsordnung der Simulation: ${input.blueprintVersion}`);
  L.push(`- Format: 5 Handlungsschritte (HS) à ${total / 5} Punkte, insgesamt ${total} Punkte, ${attempt.exam.durationMinutes} Minuten`);
  L.push('- Notenschlüssel (IHK): 1 ab 92 %, 2 ab 81 %, 3 ab 67 %, 4 ab 50 % (bestanden), 5 ab 30 %, 6 darunter');
  L.push('- Handlungsschritte:');
  for (const s of SECTIONS) L.push(`  - HS${sectionNo(s)}: ${SECTION_TITLES[s]}`);
  L.push('- Aufgabentypen: ' + Object.values(QUESTION_TYPE_LABELS).join(', '));
  L.push('- Schwierigkeit: 1 = leicht, 2 = mittel, 3 = schwer. Ergebnis je Aufgabe: richtig / teilweise / falsch / nicht bearbeitet.');
  L.push('');

  L.push('## 2. Gesamtergebnis');
  L.push('');
  L.push(`| Kennzahl | Wert |`);
  L.push(`|---|---|`);
  L.push(`| Prüfling | ${cell(userName)} |`);
  L.push(`| Datum | ${dateDE(attempt.startedAt)} |`);
  L.push(`| Bearbeitungszeit | ${minutesUsed !== null ? `${minutesUsed} von ${attempt.exam.durationMinutes} Minuten` : '—'} |`);
  L.push(`| Punkte | ${fmt(attempt.score)} von ${total} (${percent.toFixed(1).replace('.', ',')} %) |`);
  L.push(`| Note | ${g.grade} (${g.label}) — ${g.passed ? 'bestanden' : 'nicht bestanden'} |`);
  L.push(`| Aufgaben | ${questions.length} gesamt: ${countOutcome('richtig')} richtig, ${countOutcome('teilweise')} teilweise, ${countOutcome('falsch')} falsch, ${countOutcome('nicht bearbeitet')} nicht bearbeitet |`);
  L.push(`| Bewertung | ${aiGraded.length} Aufgabe(n) KI-bewertet, ${selfGraded.length} selbst bewertet, ${manual.length} ohne KI-Bewertung, Rest regelbasiert |`);
  L.push('');

  L.push('### Ergebnis je Handlungsschritt');
  L.push('');
  L.push('| HS | Handlungsschritt | Punkte | Prozent | Verloren |');
  L.push('|---|---|---|---|---|');
  for (const s of attempt.exam.sections) {
    const max = s.questions.reduce((x, q) => x + q.points, 0);
    const got = s.questions.reduce((x, q) => x + (attempt.results[q.id]?.points ?? 0), 0);
    L.push(`| HS${sectionNo(s.section)} | ${cell(s.title)} | ${fmt(got)} / ${max} | ${pct(got, max)} % | ${fmt(max - got)} |`);
  }
  L.push('');

  L.push('## 3. Ergebnis je Thema (nach Priorität, größter Punktverlust zuerst)');
  L.push('');
  L.push('Priorität: hoch = unter 50 % und mindestens 2 Punkte verloren; mittel = unter 50 % oder mindestens 3 Punkte verloren; niedrig = kleine Abzüge; keine = volle Punktzahl.');
  L.push('');
  L.push('| Priorität | Thema | HS | Aufgaben | Punkte | Prozent | Verloren |');
  L.push('|---|---|---|---|---|---|---|');
  for (const t of topics) {
    L.push(`| ${t.priority} | ${cell(t.label)} (\`${t.topic}\`) | HS${sectionNo(t.section)} | ${t.count} | ${fmt(t.got)} / ${fmt(t.max)} | ${t.percent} % | ${fmt(t.max - t.got)} |`);
  }
  L.push('');

  L.push('## 4. Aufgaben im Detail');
  L.push('');
  L.push('Sortiert nach Handlungsschritt. Vollständig richtige Aufgaben stehen nur als Einzeiler.');
  L.push('');
  for (const s of attempt.exam.sections) {
    L.push(`### HS${sectionNo(s.section)}: ${s.title}`);
    L.push('');
    s.questions.forEach((q, qi) => {
      const r = attempt.results[q.id];
      const o = outcomes.get(q.id)!;
      const head = `${sectionNo(s.section)}.${qi + 1} ${q.title}`;
      const meta = `${QUESTION_TYPE_LABELS[q.type]}, Thema ${topicLabel(q.topic)} (\`${q.topic}\`), Schwierigkeit ${q.difficulty}, ${fmt(r?.points ?? 0)}/${q.points} P`;
      if (o === 'richtig') {
        L.push(`- ✓ **${head}** — ${meta} — richtig`);
        return;
      }
      if (L[L.length - 1] !== '') L.push('');
      L.push(`#### ${o === 'nicht bearbeitet' ? '○' : o === 'teilweise' ? '◐' : '✗'} ${head}`);
      L.push('');
      L.push(`- Ergebnis: **${o}** — ${meta}${gradingNote(r)}`);
      if (q.scenario) L.push(...quoted('Situation', q.scenario, 900));
      L.push(...quoted('Aufgabe', q.text, 1500));
      L.push(...renderAnswerBlock(q, attempt.answers[q.id], r));
      if ('solution' in q && q.solution) L.push(...quoted('Musterlösung', q.solution, 2500));
      if (r?.feedback) L.push(`- ${r.aiGraded ? 'Feedback der KI-Bewertung' : 'Auswertung'}: ${cell(r.feedback)}`);
      if (q.explanation) L.push(...quoted('Erläuterung zur Lösung', q.explanation, 1200));
      L.push('');
    });
    if (L[L.length - 1] !== '') L.push('');
  }

  L.push('## 5. Verlauf früherer Probeprüfungen');
  L.push('');
  if (!history.length) {
    L.push('Dies ist die erste ausgewertete Probeprüfung. Ein Vergleich mit früheren Versuchen ist noch nicht möglich.');
  } else {
    L.push('| Datum | Punkte | Note | HS1 | HS2 | HS3 | HS4 | HS5 |');
    L.push('|---|---|---|---|---|---|---|---|');
    const row = (a: ExportAttempt, label: string) => {
      const p = (100 * a.score) / a.exam.totalPoints;
      const bySec = SECTIONS.map((sec) => {
        const s = a.exam.sections.find((x) => x.section === sec);
        if (!s) return '—';
        const max = s.questions.reduce((x, q) => x + q.points, 0);
        const got = s.questions.reduce((x, q) => x + (a.results[q.id]?.points ?? 0), 0);
        return `${pct(got, max)} %`;
      });
      return `| ${label} | ${fmt(a.score)} / ${a.exam.totalPoints} (${Math.round(p)} %) | ${ihkGrade(p).grade} | ${bySec.join(' | ')} |`;
    };
    L.push(row(attempt, `${dateISO(attempt.startedAt)} (diese)`));
    for (const h of history) L.push(row(h, dateISO(h.startedAt)));
    L.push('');

    // Themen über alle Versuche
    const all = [attempt, ...history];
    const agg = new Map<string, Agg>();
    const attemptsPerTopic = new Map<string, number>();
    for (const a of all) {
      const seen = new Set<string>();
      for (const s of a.exam.sections) for (const q of s.questions) {
        addAgg(agg, q.topic, a.results[q.id]?.points ?? 0, q.points);
        if (!seen.has(q.topic)) { seen.add(q.topic); attemptsPerTopic.set(q.topic, (attemptsPerTopic.get(q.topic) ?? 0) + 1); }
      }
    }
    const recurring = [...agg.entries()]
      .filter(([t, a]) => (attemptsPerTopic.get(t) ?? 0) >= 2 && a.got / a.max < 0.7)
      .map(([t, a]) => ({ topic: t, ...a, percent: pct(a.got, a.max), n: attemptsPerTopic.get(t) ?? 0 }))
      .sort((x, y) => x.percent - y.percent || y.max - y.got - (x.max - x.got));
    L.push(`### Wiederkehrende Schwächen (Themen, die in mindestens 2 Versuchen vorkamen und insgesamt unter 70 % liegen)`);
    L.push('');
    if (!recurring.length) L.push('Keine wiederkehrenden Schwächen über mehrere Versuche erkennbar.');
    else {
      L.push('| Thema | Versuche | Aufgaben | Punkte gesamt | Prozent |');
      L.push('|---|---|---|---|---|');
      for (const t of recurring) L.push(`| ${cell(topicLabel(t.topic))} (\`${t.topic}\`) | ${t.n} | ${t.count} | ${fmt(t.got)} / ${fmt(t.max)} | ${t.percent} % |`);
    }
  }
  L.push('');

  L.push('## 6. Kennzahlen (maschinenlesbar)');
  L.push('');
  L.push('```json');
  L.push(JSON.stringify(buildLearningExportJson(input, { compact: true }), null, 2));
  L.push('```');
  L.push('');
  return L.join('\n');
}

/* ---------- JSON ---------- */

export function buildLearningExportJson(input: ExportInput, opts: { compact?: boolean } = {}) {
  const { attempt, history } = input;
  const total = attempt.exam.totalPoints;
  const percent = (100 * attempt.score) / total;
  const g = ihkGrade(percent);
  const sections = attempt.exam.sections.map((s) => {
    const max = s.questions.reduce((x, q) => x + q.points, 0);
    const got = s.questions.reduce((x, q) => x + (attempt.results[q.id]?.points ?? 0), 0);
    return { section: s.section, no: sectionNo(s.section), title: s.title, points: got, maxPoints: max, percent: pct(got, max) };
  });
  const topics = topicRows(attempt).map((t) => ({ topic: t.topic, label: t.label, section: t.section, questions: t.count, points: t.got, maxPoints: t.max, percent: t.percent, priority: t.priority }));
  const base = {
    format: 'ap1-lernplan-export',
    version: 1,
    purpose: 'Grundlage für einen KI-erstellten Lernplan zur IHK-Abschlussprüfung Teil 1 (FIAE)',
    attemptId: attempt.id,
    date: attempt.startedAt,
    minutesUsed: attempt.submittedAt ? Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000) : null,
    score: attempt.score,
    totalPoints: total,
    percent: Math.round(percent * 10) / 10,
    grade: g.grade,
    gradeLabel: g.label,
    passed: g.passed,
    sections,
    topics,
    history: history.map((h) => ({ date: h.startedAt, score: h.score, totalPoints: h.exam.totalPoints, percent: Math.round((1000 * h.score) / h.exam.totalPoints) / 10, grade: ihkGrade((100 * h.score) / h.exam.totalPoints).grade })),
  };
  if (opts.compact) return base;
  const questions = attempt.exam.sections.flatMap((s) =>
    s.questions.map((q, qi) => {
      const r = attempt.results[q.id];
      return {
        no: `${sectionNo(s.section)}.${qi + 1}`,
        id: q.id,
        section: q.section,
        topic: q.topic,
        topicLabel: topicLabel(q.topic),
        type: q.type,
        typeLabel: QUESTION_TYPE_LABELS[q.type],
        difficulty: q.difficulty,
        title: q.title,
        scenario: q.scenario,
        text: q.text,
        points: r?.points ?? 0,
        maxPoints: q.points,
        outcome: outcomeOf(q, attempt.answers[q.id], r),
        answer: attempt.answers[q.id] ?? null,
        solution: 'solution' in q ? q.solution : undefined,
        explanation: q.explanation,
        feedback: r?.feedback,
        aiGraded: r?.aiGraded ?? false,
        selfGraded: r?.needsManualReview ?? false,
        details: r?.details,
        /** Textdarstellung wie im Markdown-Export (Antwort vs. Lösung) */
        rendered: renderAnswerBlock(q, attempt.answers[q.id], r).join('\n'),
      };
    }),
  );
  return { ...base, blueprintVersion: input.blueprintVersion, questions };
}
