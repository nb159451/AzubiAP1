/**
 * Erzeugt aus Prüfungsordnung (Blueprint) und Katalog eine konkrete Prüfung.
 */
import { randomUUID } from 'node:crypto';
import type { Exam, ExamSection, Question } from '../../../shared/types.js';
import { SECTION_TITLES } from '../../../shared/types.js';
import { catalog } from '../catalog/index.js';
import { BLUEPRINT, type Slot } from './blueprint.js';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function candidates(slot: Slot, section: string): Question[] {
  return catalog.filter(
    (q) =>
      q.section === section &&
      slot.types.includes(q.type) &&
      q.points === slot.points &&
      (!slot.topics || slot.topics.includes(q.topic)),
  );
}

/** Instanziiert eine Frage für eine konkrete Prüfung (z. B. Antwortoptionen mischen). */
function instantiate(q: Question): Question {
  switch (q.type) {
    case 'multiple_choice':
      return { ...q, options: shuffle(q.options) };
    case 'matching':
      return { ...q, right: shuffle(q.right) };
    default:
      return structuredClone(q);
  }
}

/**
 * @param recentlyUsed IDs der Fragen aus den letzten Versuchen des Prüflings; werden gemieden,
 *   solange genügend Alternativen vorhanden sind.
 */
export function generateExam(recentlyUsed: Set<string>): Exam {
  const used = new Set<string>();
  const sections: ExamSection[] = [];

  for (const bs of BLUEPRINT.sections) {
    const questions: Question[] = [];
    for (const slot of bs.slots) {
      const all = candidates(slot, bs.section).filter((q) => !used.has(q.id));
      if (all.length === 0) {
        throw new Error(`Keine Frage für Slot "${slot.label}" (${bs.section}) im Katalog`);
      }
      const fresh = all.filter((q) => !recentlyUsed.has(q.id));
      const pool = fresh.length > 0 ? fresh : all;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      used.add(pick.id);
      questions.push(instantiate(pick));
    }
    sections.push({ section: bs.section, title: SECTION_TITLES[bs.section], questions });
  }

  return {
    id: randomUUID(),
    blueprintVersion: BLUEPRINT.version,
    durationMinutes: BLUEPRINT.durationMinutes,
    totalPoints: sections.reduce((s, sec) => s + sec.questions.reduce((x, q) => x + q.points, 0), 0),
    sections,
  };
}

/** Entfernt alle Lösungsinformationen, bevor die Prüfung an den Client geht. */
export function sanitizeExam(exam: Exam): Exam {
  return {
    ...exam,
    sections: exam.sections.map((s) => ({ ...s, questions: s.questions.map(sanitizeQuestion) })),
  };
}

export function sanitizeQuestion(q: Question): Question {
  const base = { ...q } as Record<string, unknown>;
  delete base.explanation;
  switch (q.type) {
    case 'multiple_choice':
      delete base.correct;
      break;
    case 'matching':
      delete base.pairs;
      break;
    case 'cloze':
      base.blanks = q.blanks.map((b) => ({ id: b.id, accepted: [], options: b.options }));
      break;
    case 'calculation':
      delete base.solution;
      delete base.expected;
      delete base.rubric;
      break;
    case 'free_text':
      delete base.solution;
      delete base.rubric;
      break;
    case 'image_fill':
      base.blanks = q.blanks.map((b) => ({ ...b, accepted: [] }));
      break;
    case 'network_diagram':
      delete base.rules;
      delete base.solution;
      break;
    case 'netzplan':
      break;
  }
  return base as unknown as Question;
}
