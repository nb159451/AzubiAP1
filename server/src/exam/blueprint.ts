/**
 * Prüfungsordnung ("Blueprint") der digitalen AP1.
 *
 * Jede Prüfung besteht aus fünf Handlungsschritten zu je 20 Punkten
 * (100 Punkte, 90 Minuten) – analog zur IHK-Abschlussprüfung Teil 1
 * "Einrichten eines IT-gestützten Arbeitsplatzes".
 *
 * Für jeden Handlungsschritt ist eine feste Folge von "Slots" definiert.
 * Ein Slot legt fest, welche Aufgabentypen, welche Punktzahl und optional
 * welche Themen zulässig sind. Beim Erzeugen einer Prüfung wird für jeden
 * Slot zufällig eine passende Aufgabe aus dem Katalog gewählt; Aufgaben,
 * die der Prüfling in seinen letzten Versuchen bereits hatte, werden
 * dabei möglichst vermieden. So entsteht jedes Mal eine andere, aber
 * immer gleich aufgebaute Prüfung.
 */
import type { QuestionType, Section } from '../../../shared/types.js';

export interface Slot {
  label: string;
  types: QuestionType[];
  points: number;
  topics?: string[];
  minPoints?: number;
  maxPoints?: number;
  /** So viele Kandidaten müssen mindestens im Katalog existieren (für Abwechslung). */
  minCandidates: number;
}
export interface BlueprintSection {
  section: Section;
  points: number;
  slots: Slot[];
}
export interface Blueprint {
  version: string;
  durationMinutes: number;
  totalPoints: number;
  sections: BlueprintSection[];
  /** So viele zurückliegende Versuche werden bei der Vermeidung von Wiederholungen berücksichtigt. */
  avoidRepeatsFromLastAttempts: number;
}

export const BLUEPRINT: Blueprint = {
  version: '2026-2 (Prüfungskatalog 2. Auflage, gültig ab Frühjahr 2025)',
  durationMinutes: 90,
  totalPoints: 100,
  avoidRepeatsFromLastAttempts: 3,
  sections: [
    {
      section: 'kundenbedarf',
      points: 20,
      slots: [
        { label: 'Netzplan (Projektplanung)', types: ['netzplan'], points: 8, minCandidates: 3 },
        { label: 'Wirtschaftlichkeits-/Kostenrechnung', types: ['calculation'], points: 5, minCandidates: 3 },
        { label: 'Grundlagen Projektmanagement (MC)', types: ['multiple_choice'], points: 2, minCandidates: 4 },
        { label: 'Zuordnung / Lückentext', types: ['matching', 'cloze'], points: 3, minCandidates: 4 },
        { label: 'Kurze Erläuterung', types: ['free_text'], points: 2, minCandidates: 3 },
      ],
    },
    {
      section: 'arbeitsplatz',
      points: 20,
      slots: [
        { label: 'Berechnung (Speicher, Leistung, Kosten)', types: ['calculation'], points: 5, minCandidates: 3 },
        { label: 'Ausfüllbild / Zuordnung', types: ['image_fill', 'matching'], points: 4, minCandidates: 3 },
        { label: 'Hardware/Software (MC)', types: ['multiple_choice'], points: 3, minCandidates: 4 },
        { label: 'Lückentext', types: ['cloze'], points: 3, minCandidates: 3 },
        { label: 'Beratung / Begründung', types: ['free_text'], points: 3, minCandidates: 3 },
        { label: 'Grundlagen (MC)', types: ['multiple_choice'], points: 2, minCandidates: 3 },
      ],
    },
    {
      section: 'sicherheit',
      points: 20,
      slots: [
        { label: 'Maßnahmen begründen', types: ['free_text'], points: 4, minCandidates: 3 },
        { label: 'Ausfüllbild / Zuordnung', types: ['image_fill', 'matching'], points: 4, minCandidates: 3 },
        { label: 'Berechnung (Backup, Verfügbarkeit, Passwörter)', types: ['calculation'], points: 5, minCandidates: 3 },
        { label: 'IT-Sicherheit (MC)', types: ['multiple_choice'], points: 3, minCandidates: 4 },
        { label: 'Lückentext', types: ['cloze'], points: 2, minCandidates: 3 },
        { label: 'Datenschutz (MC)', types: ['multiple_choice'], points: 2, minCandidates: 3 },
      ],
    },
    {
      section: 'netzwerk',
      points: 20,
      slots: [
        { label: 'Netzwerkplan ergänzen', types: ['network_diagram'], points: 6, minCandidates: 3 },
        { label: 'Subnetting / Übertragung berechnen', types: ['calculation'], points: 5, minCandidates: 3 },
        { label: 'Ausfüllbild / Zuordnung', types: ['image_fill', 'matching'], points: 4, minCandidates: 3 },
        { label: 'Netzwerkgrundlagen (MC)', types: ['multiple_choice'], points: 3, minCandidates: 4 },
        { label: 'Lückentext', types: ['cloze'], points: 2, minCandidates: 3 },
      ],
    },
    {
      section: 'entwicklung',
      points: 20,
      slots: [
        { label: 'Diagramm vervollständigen (Aktivitätsdiagramm, BPMN, UML, ER)', types: ['image_fill'], points: 5, minCandidates: 3 },
        { label: 'Pseudocode / Schreibtischtest / Erläuterung', types: ['free_text'], points: 4, minCandidates: 3 },
        { label: 'Zuordnung', types: ['matching'], points: 4, minCandidates: 3 },
        { label: 'Lückentext', types: ['cloze'], points: 3, minCandidates: 3 },
        { label: 'Grundlagen (MC)', types: ['multiple_choice'], points: 2, minCandidates: 6 },
        { label: 'Grundlagen (MC)', types: ['multiple_choice'], points: 2, minCandidates: 6 },
      ],
    },
  ],
};
