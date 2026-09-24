/**
 * Netzplan-Aufgaben (Vorgangsknotennetz). Die Lösung (FAZ/FEZ/SAZ/SEZ/GP/FP,
 * kritischer Pfad, Gesamtdauer) wird zur Laufzeit aus den Vorgängen berechnet.
 */
import type { Question } from '../../../shared/types.js';

const TEXT =
  'Erstellen Sie den Netzplan: Tragen Sie für jeden Vorgang den frühesten Anfangs- (FAZ) und Endzeitpunkt (FEZ), den spätesten Anfangs- (SAZ) und Endzeitpunkt (SEZ) sowie den Gesamtpuffer (GP) und den freien Puffer (FP) ein. Markieren Sie die Vorgänge des kritischen Pfads und geben Sie die Gesamtdauer des Projekts an.\n\nHinweis: Das Projekt beginnt zum Zeitpunkt 0. FAZ eines Vorgangs = maximales FEZ seiner Vorgänger; SEZ = minimales SAZ seiner Nachfolger.';

export const questions: Question[] = [
  {
    id: 'kb-np-001',
    section: 'kundenbedarf',
    topic: 'netzplantechnik',
    type: 'netzplan',
    title: 'Netzplan: Einführung eines Warenwirtschaftssystems',
    scenario:
      'Die Velomotion GmbH (Fahrradmanufaktur, 45 Mitarbeitende) führt ein neues Warenwirtschaftssystem ein. Sie haben als Projektmitarbeiter/-in die Vorgangsliste mit Dauern (in Arbeitstagen) und Abhängigkeiten zusammengestellt.',
    text:
      '| Vorgang | Bezeichnung | Dauer | Vorgänger\n| A | Anforderungsanalyse | 3 | –\n| B | Softwareauswahl | 4 | A\n| C | Hardwarebeschaffung | 6 | A\n| D | Serverinstallation | 2 | C\n| E | Schulung vorbereiten | 3 | B\n| F | Datenmigration | 5 | B, D\n| G | Schulung durchführen | 2 | E, F\n| H | Go-Live | 1 | G\n\n' +
      TEXT,
    points: 8,
    difficulty: 2,
    unit: 'Tage',
    criticalPathPoints: 2,
    activities: [
      { id: 'A', name: 'Anforderungsanalyse', duration: 3, predecessors: [] },
      { id: 'B', name: 'Softwareauswahl', duration: 4, predecessors: ['A'] },
      { id: 'C', name: 'Hardwarebeschaffung', duration: 6, predecessors: ['A'] },
      { id: 'D', name: 'Serverinstallation', duration: 2, predecessors: ['C'] },
      { id: 'E', name: 'Schulung vorbereiten', duration: 3, predecessors: ['B'] },
      { id: 'F', name: 'Datenmigration', duration: 5, predecessors: ['B', 'D'] },
      { id: 'G', name: 'Schulung durchführen', duration: 2, predecessors: ['E', 'F'] },
      { id: 'H', name: 'Go-Live', duration: 1, predecessors: ['G'] },
    ],
    explanation:
      'Vorwärtsrechnung: A 0–3, B 3–7, C 3–9, D 9–11, E 7–10, F 11–16, G 16–18, H 18–19. Der kritische Pfad A–C–D–F–G–H hat keinen Puffer; B und E besitzen Puffer (GP B = 4, GP E = 6). Gesamtdauer 19 Tage.',
  },
  {
    id: 'kb-np-002',
    section: 'kundenbedarf',
    topic: 'netzplantechnik',
    type: 'netzplan',
    title: 'Netzplan: Umzug der Büro-IT',
    scenario:
      'Die Steuerkanzlei Bergmann & Partner zieht in neue Büroräume. Die IT-Infrastruktur muss am neuen Standort aufgebaut werden. Die Projektleitung hat folgende Vorgänge (Dauer in Arbeitstagen) festgelegt.',
    text:
      '| Vorgang | Bezeichnung | Dauer | Vorgänger\n| A | Umzugsplanung | 2 | –\n| B | Verkabelung der Räume | 5 | A\n| C | Beschaffung Switches | 4 | A\n| D | Montage Netzwerkschrank | 3 | B\n| E | Konfiguration Switches | 2 | C, D\n| F | Aufbau Arbeitsplätze | 4 | D\n| G | Funktionstest | 2 | E, F\n\n' +
      TEXT,
    points: 8,
    difficulty: 2,
    unit: 'Tage',
    criticalPathPoints: 2,
    activities: [
      { id: 'A', name: 'Umzugsplanung', duration: 2, predecessors: [] },
      { id: 'B', name: 'Verkabelung', duration: 5, predecessors: ['A'] },
      { id: 'C', name: 'Beschaffung Switches', duration: 4, predecessors: ['A'] },
      { id: 'D', name: 'Montage Netzwerkschrank', duration: 3, predecessors: ['B'] },
      { id: 'E', name: 'Konfiguration Switches', duration: 2, predecessors: ['C', 'D'] },
      { id: 'F', name: 'Aufbau Arbeitsplätze', duration: 4, predecessors: ['D'] },
      { id: 'G', name: 'Funktionstest', duration: 2, predecessors: ['E', 'F'] },
    ],
    explanation:
      'Kritischer Pfad: A–B–D–F–G mit Gesamtdauer 16 Tage. C hat 4 Tage Gesamtpuffer (kann bis Tag 6 starten), E hat 2 Tage Puffer, da F länger dauert als E.',
  },
  {
    id: 'kb-np-003',
    section: 'kundenbedarf',
    topic: 'netzplantechnik',
    type: 'netzplan',
    title: 'Netzplan: Entwicklung einer Kunden-App',
    scenario:
      'Die Stadtwerke Nordheim beauftragen Ihr Softwarehaus mit der Entwicklung einer Kunden-App zur Zählerstandserfassung. Für die Terminplanung liegt folgende Vorgangsliste (Dauer in Arbeitstagen) vor.',
    text:
      '| Vorgang | Bezeichnung | Dauer | Vorgänger\n| A | Fachkonzept | 4 | –\n| B | UI-Design | 5 | A\n| C | Backend-Entwicklung | 8 | A\n| D | Frontend-Entwicklung | 6 | B\n| E | API-Anbindung | 3 | C, D\n| F | Systemtest | 4 | E\n| G | Dokumentation | 2 | C\n| H | Release | 1 | F, G\n\n' +
      TEXT,
    points: 8,
    difficulty: 3,
    unit: 'Tage',
    criticalPathPoints: 2,
    activities: [
      { id: 'A', name: 'Fachkonzept', duration: 4, predecessors: [] },
      { id: 'B', name: 'UI-Design', duration: 5, predecessors: ['A'] },
      { id: 'C', name: 'Backend-Entwicklung', duration: 8, predecessors: ['A'] },
      { id: 'D', name: 'Frontend-Entwicklung', duration: 6, predecessors: ['B'] },
      { id: 'E', name: 'API-Anbindung', duration: 3, predecessors: ['C', 'D'] },
      { id: 'F', name: 'Systemtest', duration: 4, predecessors: ['E'] },
      { id: 'G', name: 'Dokumentation', duration: 2, predecessors: ['C'] },
      { id: 'H', name: 'Release', duration: 1, predecessors: ['F', 'G'] },
    ],
    explanation:
      'B–D (5 + 6 = 11 Tage) ist länger als C (8 Tage); der kritische Pfad ist daher A–B–D–E–F–H mit 23 Tagen. C hat 3 Tage Puffer, G sogar 8 Tage (FAZ 12, SAZ 20).',
  },
  {
    id: 'kb-np-004',
    section: 'kundenbedarf',
    topic: 'netzplantechnik',
    type: 'netzplan',
    title: 'Netzplan: Einrichtung eines Schulungsraums',
    scenario:
      'Das Bildungszentrum Rheinland richtet einen neuen IT-Schulungsraum mit 16 Arbeitsplätzen ein. Sie sollen den Ablauf mit der Netzplantechnik planen (Dauer in Arbeitstagen).',
    text:
      '| Vorgang | Bezeichnung | Dauer | Vorgänger\n| A | Bedarfsermittlung | 2 | –\n| B | Angebote einholen | 3 | A\n| C | Raumvorbereitung (Strom, Möbel) | 4 | A\n| D | Bestellung auslösen | 1 | B\n| E | Lieferzeit Geräte | 7 | D\n| F | Netzwerk einrichten | 3 | C\n| G | Aufbau und Installation der Geräte | 2 | E, F\n| H | Abnahme | 1 | G\n\n' +
      TEXT,
    points: 8,
    difficulty: 2,
    unit: 'Tage',
    criticalPathPoints: 2,
    activities: [
      { id: 'A', name: 'Bedarfsermittlung', duration: 2, predecessors: [] },
      { id: 'B', name: 'Angebote einholen', duration: 3, predecessors: ['A'] },
      { id: 'C', name: 'Raumvorbereitung', duration: 4, predecessors: ['A'] },
      { id: 'D', name: 'Bestellung', duration: 1, predecessors: ['B'] },
      { id: 'E', name: 'Lieferzeit', duration: 7, predecessors: ['D'] },
      { id: 'F', name: 'Netzwerk einrichten', duration: 3, predecessors: ['C'] },
      { id: 'G', name: 'Aufbau/Installation', duration: 2, predecessors: ['E', 'F'] },
      { id: 'H', name: 'Abnahme', duration: 1, predecessors: ['G'] },
    ],
    explanation:
      'Kritischer Pfad A–B–D–E–G–H, Gesamtdauer 16 Tage. Der Strang C–F (7 Tage) ist deutlich kürzer als B–D–E (11 Tage) und hat 4 Tage Puffer.',
  },
  {
    id: 'kb-np-005',
    section: 'kundenbedarf',
    topic: 'netzplantechnik',
    type: 'netzplan',
    title: 'Netzplan: Migration in die Cloud',
    scenario:
      'Die Online-Apotheke MediShip GmbH migriert ihren Webshop in eine Cloud-Umgebung. Als Junior-Projektleiter/-in planen Sie den Ablauf (Dauer in Arbeitstagen).',
    text:
      '| Vorgang | Bezeichnung | Dauer | Vorgänger\n| A | Ist-Analyse | 3 | –\n| B | Cloud-Anbieter auswählen | 2 | A\n| C | Sicherheitskonzept | 4 | A\n| D | Testumgebung aufbauen | 3 | B, C\n| E | Datenbank migrieren | 5 | D\n| F | Anwendung migrieren | 4 | D\n| G | Lasttest | 2 | E, F\n| H | Umschaltung (Cutover) | 1 | G\n\n' +
      TEXT,
    points: 8,
    difficulty: 2,
    unit: 'Tage',
    criticalPathPoints: 2,
    activities: [
      { id: 'A', name: 'Ist-Analyse', duration: 3, predecessors: [] },
      { id: 'B', name: 'Anbieterauswahl', duration: 2, predecessors: ['A'] },
      { id: 'C', name: 'Sicherheitskonzept', duration: 4, predecessors: ['A'] },
      { id: 'D', name: 'Testumgebung', duration: 3, predecessors: ['B', 'C'] },
      { id: 'E', name: 'DB-Migration', duration: 5, predecessors: ['D'] },
      { id: 'F', name: 'App-Migration', duration: 4, predecessors: ['D'] },
      { id: 'G', name: 'Lasttest', duration: 2, predecessors: ['E', 'F'] },
      { id: 'H', name: 'Cutover', duration: 1, predecessors: ['G'] },
    ],
    explanation:
      'Kritischer Pfad A–C–D–E–G–H mit 18 Tagen. B (2 Tage) hat gegenüber C (4 Tage) 2 Tage Puffer, F hat 1 Tag Puffer gegenüber E.',
  },
];
