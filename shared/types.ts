/**
 * Gemeinsames Datenmodell für Server und Client.
 *
 * Handlungsschritte (Sections) orientieren sich am Prüfungskatalog der
 * IHK für Teil 1 der gestreckten Abschlussprüfung ("Einrichten eines
 * IT-gestützten Arbeitsplatzes"), der für alle IT-Berufe identisch ist.
 */

export type Section =
  | 'kundenbedarf' // HS1: Kundenbedarf analysieren, Projektplanung, Netzplan, Wirtschaftlichkeit
  | 'arbeitsplatz' // HS2: Arbeitsplatz ausstatten: Hardware, Software, Lizenzen, Ergonomie, Kaufmännisches
  | 'sicherheit' // HS3: IT-Sicherheit und Datenschutz
  | 'netzwerk' // HS4: Vernetzung, IP-Adressierung, Protokolle, Komponenten
  | 'entwicklung'; // HS5: Programmierung, Algorithmen, UML/BPMN, Datenmodellierung, Test

export const SECTION_TITLES: Record<Section, string> = {
  kundenbedarf: 'Kundenbedarf analysieren und Projekt planen',
  arbeitsplatz: 'IT-Arbeitsplatz nach Kundenwunsch ausstatten',
  sicherheit: 'IT-Sicherheit und Datenschutz umsetzen',
  netzwerk: 'IT-Systeme in ein Netzwerk einbinden',
  entwicklung: 'Anwendungen entwickeln, Daten modellieren und testen',
};

export type QuestionType =
  | 'multiple_choice'
  | 'matching'
  | 'cloze'
  | 'calculation'
  | 'free_text'
  | 'image_fill'
  | 'network_diagram'
  | 'netzplan';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  matching: 'Zuordnung',
  cloze: 'Lückentext',
  calculation: 'Rechenaufgabe mit Lösungsweg',
  free_text: 'Freitext / Erläuterung',
  image_fill: 'Ausfüllbild',
  network_diagram: 'Netzwerkplan ergänzen',
  netzplan: 'Netzplan (Projektmanagement)',
};

export interface QuestionBase {
  /** Eindeutig, z. B. "kb-mc-001" */
  id: string;
  section: Section;
  /** Feingranulares Thema, z. B. "netzplantechnik", "subnetting" */
  topic: string;
  type: QuestionType;
  title: string;
  /** Aufgabentext. Zeilenumbrüche werden dargestellt, ** fett ** und `code` werden unterstützt. */
  text: string;
  points: number;
  /** 1 = leicht, 2 = mittel, 3 = schwer */
  difficulty: 1 | 2 | 3;
  /** Wird nach der Auswertung angezeigt. */
  explanation?: string;
  /** Optionale Situationsbeschreibung (Handlungssituation), die vor dem Aufgabentext angezeigt wird. */
  scenario?: string;
}

/* ---------- Multiple Choice ---------- */
export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple_choice';
  options: { id: string; text: string }[];
  /** IDs der korrekten Optionen (bei multi=false genau eine). */
  correct: string[];
  multi: boolean;
}

/* ---------- Zuordnung ---------- */
export interface MatchingQuestion extends QuestionBase {
  type: 'matching';
  left: { id: string; text: string }[];
  /** Kann Distraktoren enthalten, die keinem linken Element zugeordnet sind. */
  right: { id: string; text: string }[];
  /** leftId -> rightId */
  pairs: Record<string, string>;
}

/* ---------- Lückentext ---------- */
export interface ClozeBlank {
  id: string;
  /** Akzeptierte Antworten (Vergleich normalisiert, Groß-/Kleinschreibung egal). */
  accepted: string[];
  /** Falls gesetzt: Dropdown mit diesen Optionen statt Freitextfeld. */
  options?: string[];
}
export interface ClozeQuestion extends QuestionBase {
  type: 'cloze';
  /** Text mit Platzhaltern der Form {{b1}}, {{b2}} ... */
  template: string;
  blanks: ClozeBlank[];
}

/* ---------- Rechenaufgabe / Freitext (KI-bewertet) ---------- */
export interface RubricItem {
  criterion: string;
  points: number;
}
export interface ExpectedValue {
  label: string;
  value: number;
  unit?: string;
  /** absolute Toleranz, Standard 0.01 */
  tolerance?: number;
}
export interface CalculationQuestion extends QuestionBase {
  type: 'calculation';
  /** Musterlösung mit vollständigem Lösungsweg. */
  solution: string;
  /** Erwartete Endergebnisse (für die heuristische Bewertung ohne KI). */
  expected: ExpectedValue[];
  rubric: RubricItem[];
}
export interface FreeTextQuestion extends QuestionBase {
  type: 'free_text';
  solution: string;
  rubric: RubricItem[];
}

/* ---------- Ausfüllbild ---------- */
export type DiagramElement =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill?: string; stroke?: string; rx?: number; dashed?: boolean }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill?: string; stroke?: string }
  | { kind: 'text'; x: number; y: number; text: string; size?: number; bold?: boolean; anchor?: 'start' | 'middle' | 'end'; color?: string; mono?: boolean }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; arrow?: boolean; dashed?: boolean; stroke?: string; arrowStart?: boolean }
  | { kind: 'path'; d: string; fill?: string; stroke?: string; dashed?: boolean };

export interface ImageBlank {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  accepted: string[];
  /** Dropdown-Optionen; ohne options ein Textfeld. */
  options?: string[];
  /** Optionaler Hinweis, wird als Placeholder angezeigt. */
  hint?: string;
}
export interface ImageFillQuestion extends QuestionBase {
  type: 'image_fill';
  diagram: { width: number; height: number; elements: DiagramElement[] };
  blanks: ImageBlank[];
}

/* ---------- Netzwerkdiagramm ---------- */
export type DeviceType =
  | 'router'
  | 'switch'
  | 'firewall'
  | 'server'
  | 'pc'
  | 'laptop'
  | 'printer'
  | 'access_point'
  | 'internet'
  | 'cloud'
  | 'nas'
  | 'modem';

export const DEVICE_LABELS: Record<DeviceType, string> = {
  router: 'Router',
  switch: 'Switch',
  firewall: 'Firewall',
  server: 'Server',
  pc: 'PC',
  laptop: 'Notebook',
  printer: 'Drucker',
  access_point: 'Access Point',
  internet: 'Internet',
  cloud: 'Cloud',
  nas: 'NAS',
  modem: 'Modem',
};

export interface NetworkDevice {
  id: string;
  type: DeviceType;
  label: string;
  x: number;
  y: number;
  /** Vorgegebene Geräte können nicht gelöscht werden. */
  fixed?: boolean;
  /** Angezeigte IP (nicht editierbar) */
  ip?: string;
  /** Editierbares IP-Feld */
  ipField?: { placeholder?: string };
}
export interface NetworkLink {
  a: string;
  b: string;
  /** Vorgegebene Verbindungen können nicht gelöscht werden. */
  fixed?: boolean;
  label?: string;
}
/** Referenz auf ein Gerät: entweder ID eines vorgegebenen Geräts oder ein Gerätetyp (irgendein Gerät dieses Typs). */
export type DeviceRef = { id: string } | { type: DeviceType };

export interface NetworkRule {
  points: number;
  description: string;
  rule:
    | { kind: 'device_exists'; type: DeviceType; min?: number; max?: number }
    | { kind: 'link_exists'; a: DeviceRef; b: DeviceRef }
    | { kind: 'link_absent'; a: DeviceRef; b: DeviceRef }
    | {
        kind: 'ip';
        deviceId: string;
        /** Exakte akzeptierte Adressen ... */
        accepted?: string[];
        /** ... oder: Adresse muss Host-Adresse in diesem Subnetz sein */
        inSubnet?: string;
        /** ... und darf keine dieser Adressen sein */
        exclude?: string[];
        /** Alle Host-IPs des Bogens müssen untereinander eindeutig sein */
        uniqueAmong?: string[];
      };
}
export interface NetworkDiagramQuestion extends QuestionBase {
  type: 'network_diagram';
  canvas: { width: number; height: number };
  devices: NetworkDevice[];
  links: NetworkLink[];
  /** Gerätetypen, die hinzugefügt werden dürfen. */
  palette: DeviceType[];
  rules: NetworkRule[];
  /** Beschreibung der Musterlösung für die Auswertung. */
  solution: string;
}

/* ---------- Netzplan ---------- */
export interface NetzplanActivity {
  id: string; // z. B. "A"
  name: string;
  duration: number;
  predecessors: string[];
}
export interface NetzplanQuestion extends QuestionBase {
  type: 'netzplan';
  activities: NetzplanActivity[];
  /** Punkte für den kritischen Pfad (Rest wird auf Knotenfelder verteilt) */
  criticalPathPoints: number;
  /** Zeiteinheit, z. B. "Tage" */
  unit: string;
}

export type Question =
  | MultipleChoiceQuestion
  | MatchingQuestion
  | ClozeQuestion
  | CalculationQuestion
  | FreeTextQuestion
  | ImageFillQuestion
  | NetworkDiagramQuestion
  | NetzplanQuestion;

/* ---------- Antworten ---------- */
export interface NetzplanNodeAnswer {
  FAZ?: number | '';
  FEZ?: number | '';
  SAZ?: number | '';
  SEZ?: number | '';
  GP?: number | '';
  FP?: number | '';
  critical?: boolean;
}
export interface NetzplanAnswer {
  nodes: Record<string, NetzplanNodeAnswer>;
  duration?: number | '';
}
export interface NetworkAnswer {
  devices: (NetworkDevice & { ipValue?: string })[];
  links: NetworkLink[];
}

export type Answer =
  | string[] // multiple_choice
  | Record<string, string> // matching, cloze, image_fill
  | string // calculation, free_text
  | NetworkAnswer
  | NetzplanAnswer;

/* ---------- Bewertung ---------- */
export interface GradeDetail {
  key: string;
  label: string;
  awarded: number;
  max: number;
  comment?: string;
  /** Erwartete Lösung für dieses Detail (z. B. Text) */
  expected?: string;
  /** Vom Prüfling gegebene Antwort */
  given?: string;
}
export interface GradeResult {
  questionId: string;
  points: number;
  maxPoints: number;
  feedback?: string;
  details?: GradeDetail[];
  /** true, wenn eine KI bewertet hat */
  aiGraded?: boolean;
  /** true, wenn keine KI verfügbar war und die Bewertung heuristisch/manuell ist */
  needsManualReview?: boolean;
  grader?: string;
  /** Fehlermeldung, falls die KI-Bewertung fehlgeschlagen ist (erneuter Versuch möglich) */
  aiError?: string;
}

/* ---------- Prüfung ---------- */
export interface ExamSection {
  section: Section;
  title: string;
  questions: Question[];
}
export interface Exam {
  id: string;
  blueprintVersion: string;
  durationMinutes: number;
  totalPoints: number;
  sections: ExamSection[];
}

export interface AttemptSummary {
  id: string;
  startedAt: string;
  submittedAt: string | null;
  deadline: string;
  score: number | null;
  totalPoints: number;
  grade: string | null;
  status: 'running' | 'grading' | 'graded' | 'expired';
}

export interface AttemptView {
  id: string;
  startedAt: string;
  deadline: string;
  submittedAt: string | null;
  status: AttemptSummary['status'];
  /** Für laufende Prüfungen ohne Lösungen, nach Abgabe mit Lösungen. */
  exam: Exam;
  answers: Record<string, Answer>;
  results?: Record<string, GradeResult>;
  score?: number;
  grade?: string;
  gradeLabel?: string;
}

/** IHK-Notenschlüssel (100-Punkte-Schema) */
export function ihkGrade(percent: number): { grade: string; label: string; passed: boolean } {
  if (percent >= 92) return { grade: '1', label: 'sehr gut', passed: true };
  if (percent >= 81) return { grade: '2', label: 'gut', passed: true };
  if (percent >= 67) return { grade: '3', label: 'befriedigend', passed: true };
  if (percent >= 50) return { grade: '4', label: 'ausreichend', passed: true };
  if (percent >= 30) return { grade: '5', label: 'mangelhaft', passed: false };
  return { grade: '6', label: 'ungenügend', passed: false };
}
