/**
 * Validiert den gesamten Fragenkatalog gegen das Schema und prüft
 * inhaltliche Konsistenz (IDs eindeutig, Lücken vorhanden, Lösungen gültig ...).
 *
 * Aufruf: npm run validate  (im Ordner AP1)
 */
import { z } from 'zod';
import { catalog } from './index.js';
import { computeNetzplan } from '../exam/netzplan.js';
import { BLUEPRINT } from '../exam/blueprint.js';
import type { Question } from '../../../shared/types.js';

const base = {
  id: z.string().regex(/^[a-z]{2}-[a-z]{2,4}-\d{3}$/, 'ID-Format: <sec>-<typ>-<nnn>, z. B. nw-mc-001'),
  section: z.enum(['kundenbedarf', 'arbeitsplatz', 'sicherheit', 'netzwerk', 'entwicklung']),
  topic: z.string().min(2),
  title: z.string().min(3),
  text: z.string().min(10),
  points: z.number().positive(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  explanation: z.string().optional(),
  scenario: z.string().optional(),
};

const item = z.object({ id: z.string(), text: z.string().min(1) });

const schema = z.discriminatedUnion('type', [
  z.object({
    ...base,
    type: z.literal('multiple_choice'),
    options: z.array(item).min(2),
    correct: z.array(z.string()).min(1),
    multi: z.boolean(),
  }),
  z.object({
    ...base,
    type: z.literal('matching'),
    left: z.array(item).min(2),
    right: z.array(item).min(2),
    pairs: z.record(z.string(), z.string()),
  }),
  z.object({
    ...base,
    type: z.literal('cloze'),
    template: z.string(),
    blanks: z.array(z.object({ id: z.string(), accepted: z.array(z.string()).min(1), options: z.array(z.string()).optional() })).min(1),
  }),
  z.object({
    ...base,
    type: z.literal('calculation'),
    solution: z.string().min(10),
    expected: z.array(z.object({ label: z.string(), value: z.number(), unit: z.string().optional(), tolerance: z.number().optional() })),
    rubric: z.array(z.object({ criterion: z.string(), points: z.number().positive() })).min(1),
  }),
  z.object({
    ...base,
    type: z.literal('free_text'),
    solution: z.string().min(10),
    rubric: z.array(z.object({ criterion: z.string(), points: z.number().positive() })).min(1),
  }),
  z.object({
    ...base,
    type: z.literal('image_fill'),
    diagram: z.object({ width: z.number(), height: z.number(), elements: z.array(z.any()) }),
    blanks: z
      .array(
        z.object({
          id: z.string(),
          x: z.number(),
          y: z.number(),
          w: z.number(),
          h: z.number(),
          accepted: z.array(z.string()).min(1),
          options: z.array(z.string()).optional(),
          hint: z.string().optional(),
        }),
      )
      .min(1),
  }),
  z.object({
    ...base,
    type: z.literal('network_diagram'),
    canvas: z.object({ width: z.number(), height: z.number() }),
    devices: z.array(z.any()),
    links: z.array(z.any()),
    palette: z.array(z.string()),
    rules: z.array(z.object({ points: z.number().positive(), description: z.string(), rule: z.any() })).min(1),
    solution: z.string(),
  }),
  z.object({
    ...base,
    type: z.literal('netzplan'),
    activities: z.array(z.object({ id: z.string(), name: z.string(), duration: z.number().positive(), predecessors: z.array(z.string()) })).min(3),
    criticalPathPoints: z.number().nonnegative(),
    unit: z.string(),
  }),
]);

const errors: string[] = [];
const ids = new Set<string>();

function check(q: Question) {
  const res = schema.safeParse(q);
  if (!res.success) {
    errors.push(`${q.id ?? '?'}: ${res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    return;
  }
  if (ids.has(q.id)) errors.push(`${q.id}: doppelte ID`);
  ids.add(q.id);

  switch (q.type) {
    case 'multiple_choice': {
      const optIds = new Set(q.options.map((o) => o.id));
      for (const c of q.correct) if (!optIds.has(c)) errors.push(`${q.id}: correct verweist auf unbekannte Option ${c}`);
      if (!q.multi && q.correct.length !== 1) errors.push(`${q.id}: single-choice braucht genau eine korrekte Option`);
      if (optIds.size !== q.options.length) errors.push(`${q.id}: doppelte Options-IDs`);
      break;
    }
    case 'matching': {
      const r = new Set(q.right.map((x) => x.id));
      for (const l of q.left) {
        if (!q.pairs[l.id]) errors.push(`${q.id}: kein Paar für ${l.id}`);
        else if (!r.has(q.pairs[l.id])) errors.push(`${q.id}: pairs[${l.id}] verweist auf unbekanntes rechtes Element`);
      }
      break;
    }
    case 'cloze': {
      const inTemplate = [...q.template.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
      const blankIds = q.blanks.map((b) => b.id);
      for (const b of blankIds) if (!inTemplate.includes(b)) errors.push(`${q.id}: Lücke ${b} fehlt im Template`);
      for (const t of inTemplate) if (!blankIds.includes(t)) errors.push(`${q.id}: Platzhalter ${t} ohne Lückendefinition`);
      for (const b of q.blanks)
        if (b.options && !b.accepted.some((a) => b.options!.some((o) => o.trim().toLowerCase() === a.trim().toLowerCase())))
          errors.push(`${q.id}: Lücke ${b.id}: keine akzeptierte Antwort in den Optionen`);
      break;
    }
    case 'calculation':
    case 'free_text': {
      const sum = q.rubric.reduce((s, r) => s + r.points, 0);
      if (Math.abs(sum - q.points) > 1e-9) errors.push(`${q.id}: Rubrik-Summe ${sum} != points ${q.points}`);
      break;
    }
    case 'image_fill': {
      for (const b of q.blanks)
        if (b.options && !b.accepted.some((a) => b.options!.some((o) => o.trim().toLowerCase() === a.trim().toLowerCase())))
          errors.push(`${q.id}: Lücke ${b.id}: keine akzeptierte Antwort in den Optionen`);
      break;
    }
    case 'network_diagram': {
      const sum = q.rules.reduce((s, r) => s + r.points, 0);
      if (Math.abs(sum - q.points) > 1e-9) errors.push(`${q.id}: Regel-Summe ${sum} != points ${q.points}`);
      const devIds = new Set(q.devices.map((d) => d.id));
      for (const l of q.links) if (!devIds.has(l.a) || !devIds.has(l.b)) errors.push(`${q.id}: Link ${l.a}-${l.b} auf unbekanntes Gerät`);
      for (const r of q.rules) {
        const refs: unknown[] = [];
        if (r.rule.kind === 'link_exists' || r.rule.kind === 'link_absent') refs.push(r.rule.a, r.rule.b);
        if (r.rule.kind === 'ip' && !devIds.has(r.rule.deviceId)) errors.push(`${q.id}: IP-Regel auf unbekanntes Gerät ${r.rule.deviceId}`);
        for (const ref of refs as { id?: string }[]) if (ref.id && !devIds.has(ref.id)) errors.push(`${q.id}: Regel verweist auf unbekanntes Gerät ${ref.id}`);
      }
      break;
    }
    case 'netzplan': {
      try {
        const ids2 = new Set(q.activities.map((a) => a.id));
        for (const a of q.activities) for (const p of a.predecessors) if (!ids2.has(p)) errors.push(`${q.id}: Vorgänger ${p} unbekannt`);
        computeNetzplan(q.activities);
      } catch (e) {
        errors.push(`${q.id}: Netzplan nicht berechenbar: ${(e as Error).message}`);
      }
      if (q.criticalPathPoints > q.points) errors.push(`${q.id}: criticalPathPoints > points`);
      break;
    }
  }
}

for (const q of catalog) check(q);

// Blueprint-Abdeckung prüfen: gibt es für jeden Slot genügend Kandidaten?
for (const sec of BLUEPRINT.sections) {
  for (const slot of sec.slots) {
    const candidates = catalog.filter(
      (q) =>
        q.section === sec.section &&
        slot.types.includes(q.type) &&
        (!slot.topics || slot.topics.includes(q.topic)) &&
        (!slot.minPoints || q.points >= slot.minPoints) &&
        (!slot.maxPoints || q.points <= slot.maxPoints),
    );
    if (candidates.length < slot.minCandidates) {
      errors.push(
        `Blueprint ${sec.section} / Slot "${slot.label}": nur ${candidates.length} Kandidaten (mindestens ${slot.minCandidates} nötig)`,
      );
    }
  }
}

const byType: Record<string, number> = {};
const bySection: Record<string, number> = {};
for (const q of catalog) {
  byType[q.type] = (byType[q.type] ?? 0) + 1;
  bySection[q.section] = (bySection[q.section] ?? 0) + 1;
}
console.log(`Fragen gesamt: ${catalog.length}`);
console.log('nach Typ:', byType);
console.log('nach Handlungsschritt:', bySection);

if (errors.length) {
  console.error(`\n${errors.length} Fehler:`);
  for (const e of errors) console.error(' -', e);
  process.exit(1);
} else {
  console.log('\nKatalog gültig.');
}
