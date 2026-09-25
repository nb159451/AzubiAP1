/**
 * Selbsttest für den KI-Lernplan-Export: erzeugt eine Prüfung, bewertet
 * synthetische Antworten und prüft Aufbau und Inhalt von Markdown und JSON.
 * Aufruf: npm test (im Ordner AP1)
 */
import assert from 'node:assert/strict';
import { generateExam } from './generator.js';
import { gradeQuestion } from './grading.js';
import { buildLearningExportJson, buildLearningExportMarkdown, outcomeOf, topicLabel, type ExportAttempt } from './export.js';
import { BLUEPRINT } from './blueprint.js';
import type { Answer, GradeResult } from '../../../shared/types.js';

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

/** Baut einen Versuch: erste MC-Aufgabe richtig, Zuordnung halb richtig, Rest unbeantwortet. */
async function makeAttempt(startedAt: string, id = 'test-attempt'): Promise<ExportAttempt> {
  const exam = generateExam(new Set());
  const questions = exam.sections.flatMap((s) => s.questions);
  const answers: Record<string, Answer> = {};
  const mc = questions.find((q) => q.type === 'multiple_choice');
  if (mc && mc.type === 'multiple_choice') answers[mc.id] = mc.correct;
  const match = questions.find((q) => q.type === 'matching');
  if (match && match.type === 'matching') {
    const half: Record<string, string> = {};
    match.left.slice(0, Math.ceil(match.left.length / 2)).forEach((l) => (half[l.id] = match.pairs[l.id]));
    answers[match.id] = half;
  }
  const calc = questions.find((q) => q.type === 'calculation');
  if (calc) answers[calc.id] = 'Mein Rechenweg mit | Pipe\nund zweiter Zeile';
  const results: Record<string, GradeResult> = {};
  for (const q of questions) results[q.id] = await gradeQuestion(q, answers[q.id]);
  const score = Object.values(results).reduce((s, r) => s + r.points, 0);
  return { id, startedAt, submittedAt: new Date(new Date(startedAt).getTime() + 75 * 60000).toISOString(), exam, answers, results, score };
}

const attempt = await makeAttempt('2026-09-20T09:00:00.000Z');
const earlier = await makeAttempt('2026-09-01T09:00:00.000Z', 'earlier-attempt');
const input = { attempt, history: [earlier], userName: 'Test Azubi', blueprintVersion: BLUEPRINT.version };

await test('Ergebnisklassifikation je Aufgabe', () => {
  const questions = attempt.exam.sections.flatMap((s) => s.questions);
  const mc = questions.find((q) => q.type === 'multiple_choice')!;
  const match = questions.find((q) => q.type === 'matching')!;
  const np = questions.find((q) => q.type === 'netzplan')!;
  assert.equal(outcomeOf(mc, attempt.answers[mc.id], attempt.results[mc.id]), 'richtig');
  assert.equal(outcomeOf(match, attempt.answers[match.id], attempt.results[match.id]), 'teilweise');
  assert.equal(outcomeOf(np, attempt.answers[np.id], attempt.results[np.id]), 'nicht bearbeitet');
});

await test('Themenbezeichnungen', () => {
  assert.equal(topicLabel('subnetting'), 'Subnetting (IPv4)');
  assert.equal(topicLabel('irgend-ein-thema'), 'Irgend Ein Thema');
});

await test('Markdown-Export: Struktur und Inhalt', () => {
  const md = buildLearningExportMarkdown(input);
  for (const h of ['## 1. Kontext der Prüfung', '## 2. Gesamtergebnis', '## 3. Ergebnis je Thema', '## 4. Aufgaben im Detail', '## 5. Verlauf früherer Probeprüfungen', '## 6. Kennzahlen (maschinenlesbar)']) {
    assert.ok(md.includes(h), `Überschrift fehlt: ${h}`);
  }
  assert.ok(md.startsWith('# AP1-Prüfungsauswertung'), 'Titel fehlt');
  assert.ok(md.includes('Anweisung an die KI'), 'Anweisung an die KI fehlt');
  assert.ok(md.includes('Test Azubi'), 'Name des Prüflings fehlt');
  assert.ok(md.includes('75 von 90 Minuten'), 'Bearbeitungszeit fehlt');
  assert.ok(md.includes('| HS1 |') && md.includes('| HS5 |'), 'Tabelle je Handlungsschritt unvollständig');
  assert.ok(md.includes('Mein Rechenweg mit | Pipe'), 'Antworttext der Rechenaufgabe fehlt');
  assert.ok(md.includes('2026-09-01'), 'Früherer Versuch fehlt im Verlauf');
  assert.ok(/\| hoch \|/.test(md), 'Keine Priorität „hoch“ trotz vieler unbeantworteter Aufgaben');
  // Maschinenlesbarer Block muss gültiges JSON sein
  const m = md.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(m, 'JSON-Block fehlt');
  const j = JSON.parse(m![1]);
  assert.equal(j.format, 'ap1-lernplan-export');
  assert.equal(j.sections.length, 5);
  assert.equal(j.history.length, 1);
  // Vollständig richtige Aufgaben nur als Einzeiler (keine eigene Überschrift)
  const mc = attempt.exam.sections.flatMap((s) => s.questions).find((q) => q.type === 'multiple_choice')!;
  assert.ok(md.includes(`**1.`) || md.includes(mc.title), 'Richtige MC-Aufgabe fehlt');
  assert.ok(!md.includes(`#### ✓`), 'Richtige Aufgaben dürfen keine Detailüberschrift bekommen');
});

await test('Markdown-Export: Tabellenzellen ohne Zeilenumbruch', () => {
  const md = buildLearningExportMarkdown(input);
  const tableLines = md.split('\n').filter((l) => l.startsWith('| '));
  for (const l of tableLines) {
    const cells = l.split(/(?<!\\)\|/).length - 2;
    assert.ok(cells >= 2, `Tabellenzeile zu kurz: ${l.slice(0, 60)}`);
  }
});

await test('JSON-Export: vollständige Aufgabenliste', () => {
  const j = buildLearningExportJson(input) as ReturnType<typeof buildLearningExportJson> & { questions: { id: string; outcome: string; rendered: string }[] };
  const n = attempt.exam.sections.reduce((s, x) => s + x.questions.length, 0);
  assert.equal(j.questions.length, n);
  assert.ok(j.questions.every((q) => ['richtig', 'teilweise', 'falsch', 'nicht bearbeitet'].includes(q.outcome)));
  assert.ok(j.questions.every((q) => typeof q.rendered === 'string' && q.rendered.length > 0));
  assert.equal(j.topics.reduce((s, t) => s + t.maxPoints, 0), attempt.exam.totalPoints);
});

await test('Export ohne Verlauf', () => {
  const md = buildLearningExportMarkdown({ ...input, history: [] });
  assert.ok(md.includes('erste ausgewertete Probeprüfung'));
});

console.log(`\n${passed} Export-Tests bestanden${process.exitCode ? ', Fehler siehe oben' : ''}.`);
