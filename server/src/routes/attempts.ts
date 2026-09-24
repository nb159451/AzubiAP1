import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, type AttemptRow } from '../db.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { generateExam, sanitizeExam } from '../exam/generator.js';
import { gradeQuestion } from '../exam/grading.js';
import { BLUEPRINT } from '../exam/blueprint.js';
import { activeProvider, mapLimit } from '../ai/grader.js';
import { ihkGrade, type Answer, type AttemptSummary, type AttemptView, type Exam, type GradeResult, type Question } from '../../../shared/types.js';

export const attemptsRouter = Router();
attemptsRouter.use(requireAuth);

const GRACE_MS = 2 * 60 * 1000; // Kulanz nach Ablauf der Zeit (Netzwerklatenz)

function toSummary(r: AttemptRow): AttemptSummary {
  const percent = r.score !== null ? (100 * r.score) / r.total_points : null;
  return {
    id: r.id,
    startedAt: r.started_at,
    submittedAt: r.submitted_at,
    deadline: r.deadline,
    score: r.score,
    totalPoints: r.total_points,
    grade: percent !== null ? ihkGrade(percent).grade : null,
    status: r.status,
  };
}

function toView(r: AttemptRow): AttemptView {
  const exam = JSON.parse(r.exam_json) as Exam;
  const finished = r.status === 'graded';
  const results = r.results_json ? (JSON.parse(r.results_json) as Record<string, GradeResult>) : undefined;
  const score = r.score ?? undefined;
  const g = score !== undefined ? ihkGrade((100 * score) / r.total_points) : undefined;
  return {
    id: r.id,
    startedAt: r.started_at,
    deadline: r.deadline,
    submittedAt: r.submitted_at,
    status: r.status,
    exam: finished ? exam : sanitizeExam(exam),
    answers: JSON.parse(r.answers_json),
    results: finished ? results : undefined,
    score,
    grade: g?.grade,
    gradeLabel: g?.label,
  };
}

function loadOwn(req: AuthedRequest, id: string): AttemptRow | undefined {
  return db.prepare('SELECT * FROM attempts WHERE id = ? AND user_id = ?').get(id, req.user!.id) as AttemptRow | undefined;
}

/** Liste aller Versuche */
attemptsRouter.get('/', (req: AuthedRequest, res) => {
  const rows = db.prepare('SELECT * FROM attempts WHERE user_id = ? ORDER BY started_at DESC').all(req.user!.id) as unknown as AttemptRow[];
  res.json({ attempts: rows.map(toSummary), aiProvider: activeProvider() });
});

/** Neue Prüfung starten */
attemptsRouter.post('/', (req: AuthedRequest, res) => {
  const running = db
    .prepare("SELECT * FROM attempts WHERE user_id = ? AND status = 'running' ORDER BY started_at DESC LIMIT 1")
    .get(req.user!.id) as AttemptRow | undefined;
  if (running && new Date(running.deadline).getTime() + GRACE_MS > Date.now()) {
    return res.status(409).json({ error: 'Es läuft bereits eine Prüfung', attemptId: running.id });
  }
  // Fragen aus den letzten Versuchen meiden
  const recent = db
    .prepare('SELECT exam_json FROM attempts WHERE user_id = ? ORDER BY started_at DESC LIMIT ?')
    .all(req.user!.id, BLUEPRINT.avoidRepeatsFromLastAttempts) as { exam_json: string }[];
  const recentlyUsed = new Set<string>();
  for (const r of recent) {
    const ex = JSON.parse(r.exam_json) as Exam;
    for (const s of ex.sections) for (const q of s.questions) recentlyUsed.add(q.id);
  }
  const exam = generateExam(recentlyUsed);
  const now = new Date();
  const deadline = new Date(now.getTime() + exam.durationMinutes * 60 * 1000);
  const id = randomUUID();
  db.prepare(
    `INSERT INTO attempts(id, user_id, started_at, deadline, submitted_at, status, exam_json, answers_json, results_json, score, total_points)
     VALUES (?, ?, ?, ?, NULL, 'running', ?, '{}', NULL, NULL, ?)`,
  ).run(id, req.user!.id, now.toISOString(), deadline.toISOString(), JSON.stringify(exam), exam.totalPoints);
  res.status(201).json(toView(loadOwn(req, id)!));
});

attemptsRouter.get('/:id', (req: AuthedRequest, res) => {
  const row = loadOwn(req, req.params.id as string);
  if (!row) return res.status(404).json({ error: 'Nicht gefunden' });
  // Abgelaufene laufende Prüfung automatisch abgeben
  if (row.status === 'running' && new Date(row.deadline).getTime() + GRACE_MS < Date.now()) {
    void submitAttempt(row);
    return res.json(toView(loadOwn(req, row.id)!));
  }
  res.json(toView(row));
});

/** Antworten zwischenspeichern (Autosave) */
attemptsRouter.put('/:id/answers', (req: AuthedRequest, res) => {
  const row = loadOwn(req, req.params.id as string);
  if (!row) return res.status(404).json({ error: 'Nicht gefunden' });
  if (row.status !== 'running') return res.status(409).json({ error: 'Prüfung bereits abgegeben' });
  if (new Date(row.deadline).getTime() + GRACE_MS < Date.now()) return res.status(409).json({ error: 'Bearbeitungszeit abgelaufen' });
  const parsed = z.object({ answers: z.record(z.string(), z.unknown()) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten' });
  const current = JSON.parse(row.answers_json) as Record<string, Answer>;
  const merged = { ...current, ...(parsed.data.answers as Record<string, Answer>) };
  db.prepare('UPDATE attempts SET answers_json = ? WHERE id = ?').run(JSON.stringify(merged), row.id);
  res.json({ ok: true, savedAt: new Date().toISOString() });
});

/** Prüfung abgeben: Bewertung läuft im Hintergrund, Client pollt den Status. */
attemptsRouter.post('/:id/submit', (req: AuthedRequest, res) => {
  const row = loadOwn(req, req.params.id as string);
  if (!row) return res.status(404).json({ error: 'Nicht gefunden' });
  if (row.status !== 'running') return res.json(toView(row));
  void submitAttempt(row);
  res.json(toView(loadOwn(req, row.id)!));
});

async function submitAttempt(row: AttemptRow) {
  const now = new Date().toISOString();
  const changed = db
    .prepare("UPDATE attempts SET status = 'grading', submitted_at = ? WHERE id = ? AND status = 'running'")
    .run(now, row.id).changes;
  if (!changed) return;
  const exam = JSON.parse(row.exam_json) as Exam;
  const answers = JSON.parse(row.answers_json) as Record<string, Answer>;
  const questions = exam.sections.flatMap((s) => s.questions);
  const results: Record<string, GradeResult> = {};
  // Deterministische Aufgaben sofort, KI-Aufgaben mit begrenzter Parallelität (Rate-Limits)
  const isAi = (q: Question) => q.type === 'calculation' || q.type === 'free_text';
  const grade = async (q: Question) => {
    try {
      results[q.id] = await gradeQuestion(q, answers[q.id]);
    } catch (err) {
      console.error(`[grading] ${q.id}:`, err);
      results[q.id] = { questionId: q.id, points: 0, maxPoints: q.points, feedback: 'Bewertung fehlgeschlagen.', needsManualReview: true };
    }
  };
  await Promise.all(questions.filter((q) => !isAi(q)).map(grade));
  await mapLimit(questions.filter(isAi), 2, grade);
  const score = Object.values(results).reduce((s, r) => s + r.points, 0);
  db.prepare("UPDATE attempts SET status = 'graded', results_json = ?, score = ? WHERE id = ?").run(JSON.stringify(results), score, row.id);
}

/** Selbstbewertung, wenn keine KI verfügbar war. */
attemptsRouter.post('/:id/self-grade', (req: AuthedRequest, res) => {
  const row = loadOwn(req, req.params.id as string);
  if (!row || row.status !== 'graded' || !row.results_json) return res.status(404).json({ error: 'Nicht gefunden' });
  const parsed = z.object({ questionId: z.string(), points: z.number().min(0) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten' });
  const results = JSON.parse(row.results_json) as Record<string, GradeResult>;
  const r = results[parsed.data.questionId];
  if (!r || !r.needsManualReview) return res.status(409).json({ error: 'Diese Aufgabe kann nicht selbst bewertet werden' });
  r.points = Math.min(r.maxPoints, Math.round(parsed.data.points * 2) / 2);
  r.grader = 'self';
  r.feedback = 'Selbst bewertet (keine KI konfiguriert).';
  const score = Object.values(results).reduce((s, x) => s + x.points, 0);
  db.prepare('UPDATE attempts SET results_json = ?, score = ? WHERE id = ?').run(JSON.stringify(results), score, row.id);
  res.json(toView(loadOwn(req, row.id)!));
});

/** Erneute KI-Bewertung einer Aufgabe, deren KI-Bewertung fehlgeschlagen ist. */
attemptsRouter.post('/:id/regrade', async (req: AuthedRequest, res) => {
  const row = loadOwn(req, req.params.id as string);
  if (!row || row.status !== 'graded' || !row.results_json) return res.status(404).json({ error: 'Nicht gefunden' });
  const parsed = z.object({ questionId: z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten' });
  if (activeProvider() === 'none') return res.status(409).json({ error: 'Keine KI konfiguriert' });
  const exam = JSON.parse(row.exam_json) as Exam;
  const q = exam.sections.flatMap((s) => s.questions).find((x) => x.id === parsed.data.questionId);
  if (!q || (q.type !== 'calculation' && q.type !== 'free_text')) return res.status(409).json({ error: 'Diese Aufgabe wird nicht per KI bewertet' });
  const results = JSON.parse(row.results_json) as Record<string, GradeResult>;
  if (results[q.id]?.aiGraded) return res.status(409).json({ error: 'Aufgabe wurde bereits per KI bewertet' });
  const answers = JSON.parse(row.answers_json) as Record<string, Answer>;
  const r = await gradeQuestion(q, answers[q.id]);
  if (!r.aiGraded) return res.status(503).json({ error: `KI derzeit nicht erreichbar: ${r.aiError ?? 'unbekannter Fehler'}` });
  results[q.id] = r;
  const score = Object.values(results).reduce((s, x) => s + x.points, 0);
  db.prepare('UPDATE attempts SET results_json = ?, score = ? WHERE id = ?').run(JSON.stringify(results), score, row.id);
  res.json(toView(loadOwn(req, row.id)!));
});
