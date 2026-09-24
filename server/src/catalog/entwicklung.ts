/**
 * Handlungsschritt 5: Anwendungen entwickeln, Daten modellieren und testen.
 *
 * Typen: multiple_choice, matching, cloze, calculation, free_text.
 * (Ausfüllbilder zu Aktivitätsdiagramm/BPMN/UML/ER liegen in ausfuellbilder.ts.)
 */
import type { Question } from '../../../shared/types.js';

export const questions: Question[] = [
  /* =====================================================================
   * Freitext (4 Punkte)
   * ===================================================================== */
  {
    id: 'ew-ft-001',
    section: 'entwicklung',
    topic: 'schreibtischtest',
    type: 'free_text',
    title: 'Schreibtischtest und Fehleranalyse',
    scenario: 'Für die Lagerverwaltung der Gartencenter Grünwald GmbH hat ein Kollege eine Funktion geschrieben, die den Durchschnitt einer Liste von Messwerten berechnet. Beim Aufruf mit der Liste [4, 8, 6] liefert sie ein falsches Ergebnis. Listen sind 0-basiert indiziert (erstes Element: Index 0).',
    text:
      '`FUNKTION durchschnitt(werte: Liste von Zahlen): Zahl`\n`  summe = 0`\n`  FÜR i = 1 BIS länge(werte)`\n`    summe = summe + werte[i]`\n`  ENDE FÜR`\n`  RÜCKGABE summe / länge(werte)`\n`ENDE FUNKTION`\n\na) Führen Sie einen Schreibtischtest für den Aufruf `durchschnitt([4, 8, 6])` durch (Tabelle mit i, werte[i], summe) und beschreiben Sie den Fehler.\nb) Nennen Sie einen weiteren Fall, in dem die Funktion auch nach der Korrektur aus a) fehlschlägt, und wie er abgefangen werden sollte.\nc) Geben Sie den korrigierten Pseudocode an.',
    points: 4,
    difficulty: 2,
    solution:
      'a) Schreibtischtest (fehlerhafte Version):\n| i | werte[i] | summe\n| 1 | 8 | 8\n| 2 | 6 | 14\n| 3 | (nicht vorhanden) | Laufzeitfehler / undefiniert\nFehler: Die Schleife beginnt bei Index 1 statt 0 und läuft bis länge(werte) = 3 statt bis länge(werte) − 1. Das erste Element wird übersprungen, und es wird auf ein nicht vorhandenes Element zugegriffen (Off-by-one-Fehler). Erwartet wäre (4 + 8 + 6) / 3 = 6.\n\nb) Leere Liste: länge(werte) = 0 führt zu einer Division durch 0. Abfangen durch Prüfung am Anfang (z. B. Rückgabe 0 oder Fehlermeldung/Exception).\n\nc) Korrigiert:\nFUNKTION durchschnitt(werte): Zahl\n  WENN länge(werte) = 0 DANN RÜCKGABE 0 (oder Fehler) ENDE WENN\n  summe = 0\n  FÜR i = 0 BIS länge(werte) − 1\n    summe = summe + werte[i]\n  ENDE FÜR\n  RÜCKGABE summe / länge(werte)\nENDE FUNKTION',
    rubric: [
      { criterion: 'Schreibtischtest nachvollziehbar durchgeführt (Werte je Durchlauf) und Off-by-one-Fehler (Start bei 1, Ende bei länge) korrekt beschrieben', points: 1.5 },
      { criterion: 'Division durch null bei leerer Liste erkannt und sinnvolle Behandlung genannt', points: 1 },
      { criterion: 'Korrigierter Pseudocode mit richtigen Schleifengrenzen (0 bis länge − 1) und Prüfung auf leere Liste', points: 1.5 },
    ],
    explanation: 'Ein Schreibtischtest verfolgt die Variablenwerte Schritt für Schritt. Typische Fehlerquellen sind Off-by-one-Fehler bei Schleifengrenzen und fehlende Behandlung von Randfällen wie leeren Eingaben.',
  },
  {
    id: 'ew-ft-002',
    section: 'entwicklung',
    topic: 'algorithmen',
    type: 'free_text',
    title: 'Pseudocode: Maximum in einer Liste bestimmen',
    scenario:
      'Das Start-up SensoLab UG entwickelt eine Auswertungssoftware für Temperatursensoren. Die Messwerte eines Tages liegen als Liste von Gleitkommazahlen vor.',
    text:
      'Schreiben Sie in Pseudocode eine Funktion `maximumMitIndex(messwerte)`, die den **höchsten Messwert** und dessen **Index** in der Liste ermittelt und beide Werte zurückgibt. Die Liste enthält mindestens ein Element. Verwenden Sie keine vorgefertigte Max-Funktion.',
    points: 4,
    difficulty: 2,
    solution:
      'FUNKTION maximumMitIndex(messwerte)\n  maxWert = messwerte[0]\n  maxIndex = 0\n  FÜR i VON 1 BIS LÄNGE(messwerte) - 1\n    WENN messwerte[i] > maxWert DANN\n      maxWert = messwerte[i]\n      maxIndex = i\n    ENDE WENN\n  ENDE FÜR\n  RÜCKGABE maxWert, maxIndex\nENDE FUNKTION',
    rubric: [
      { criterion: 'Sinnvolle Initialisierung (erstes Element als vorläufiges Maximum, Index 0)', points: 1 },
      { criterion: 'Schleife, die alle (restlichen) Elemente der Liste durchläuft', points: 1 },
      { criterion: 'Vergleich mit dem bisherigen Maximum und Aktualisierung von Wert und Index', points: 1.5 },
      { criterion: 'Rückgabe beider Werte, Funktionskopf mit Parameter', points: 0.5 },
    ],
    explanation:
      'Typischer linearer Suchalgorithmus: ein vorläufiges Maximum wird mit jedem weiteren Element verglichen und bei Bedarf ersetzt. Laufzeit O(n).',
  },
  {
    id: 'ew-ft-003',
    section: 'entwicklung',
    topic: 'testen',
    type: 'free_text',
    title: 'Testfälle mit Äquivalenzklassen und Grenzwerten',
    scenario:
      'Im Kassensystem der Möbelhaus Holzwurm GmbH gibt es ein Eingabefeld für einen Rabatt in Prozent. Laut Spezifikation sind nur **ganzzahlige Werte von 0 bis 50** zulässig.',
    text:
      'a) Bilden Sie die Äquivalenzklassen für dieses Eingabefeld (gültige und ungültige Klassen).\nb) Leiten Sie daraus mithilfe der Grenzwertanalyse konkrete Testwerte ab und geben Sie für jeden Testwert das erwartete Verhalten an.',
    points: 4,
    difficulty: 2,
    solution:
      'a) Äquivalenzklassen:\n- gültig: ganze Zahlen 0 ≤ x ≤ 50 (z. B. 25)\n- ungültig: ganze Zahlen < 0 (z. B. −5)\n- ungültig: ganze Zahlen > 50 (z. B. 80)\n- ungültig: nicht ganzzahlige bzw. nicht numerische Eingaben (z. B. 12,5; "abc"; leer)\n\nb) Grenzwerte:\n| Testwert | erwartetes Verhalten\n| −1 | Ablehnung mit Fehlermeldung\n| 0 | Annahme (unterer Grenzwert)\n| 50 | Annahme (oberer Grenzwert)\n| 51 | Ablehnung mit Fehlermeldung\nErgänzend ein Repräsentant aus der Mitte (z. B. 25 → Annahme) und ein nicht numerischer Wert (z. B. "abc" → Ablehnung).',
    rubric: [
      { criterion: 'Gültige Äquivalenzklasse korrekt angegeben (0 bis 50, ganzzahlig)', points: 1 },
      { criterion: 'Mindestens zwei ungültige Klassen (kleiner 0, größer 50, nicht ganzzahlig/nicht numerisch)', points: 1.5 },
      { criterion: 'Grenzwerte −1, 0, 50, 51 mit korrektem erwartetem Verhalten', points: 1.5 },
    ],
    explanation:
      'Die Äquivalenzklassenbildung reduziert die Anzahl der Testfälle; die Grenzwertanalyse testet zusätzlich die Ränder jeder Klasse, weil dort erfahrungsgemäß die meisten Fehler auftreten.',
  },
  {
    id: 'ew-ft-004',
    section: 'entwicklung',
    topic: 'normalisierung',
    type: 'free_text',
    title: 'Tabelle in die 3. Normalform überführen',
    scenario:
      'Die Fahrschule Blinker GmbH speichert ihre Rechnungen bisher in einer einzigen Tabelle. Jede Rechnung kann mehrere Positionen enthalten.',
    text:
      'Gegeben ist die folgende (unnormalisierte) Tabelle mit dem zusammengesetzten Primärschlüssel (RechnungsNr, ArtikelNr):\n\n| RechnungsNr | Datum | KundenNr | KundenName | KundenOrt | ArtikelNr | ArtikelBez | Menge | Einzelpreis\n\nÜberführen Sie die Tabelle schrittweise in die **3. Normalform**. Geben Sie die entstehenden Tabellen mit ihren Attributen an, kennzeichnen Sie Primär- und Fremdschlüssel und begründen Sie kurz jeden Normalisierungsschritt.',
    points: 4,
    difficulty: 3,
    solution:
      '1NF: Alle Attribute sind atomar, ein Primärschlüssel (RechnungsNr, ArtikelNr) ist festgelegt – erfüllt.\n\n2NF: Nichtschlüsselattribute dürfen nicht nur von einem Teil des Schlüssels abhängen. Datum, KundenNr, KundenName, KundenOrt hängen nur von RechnungsNr ab; ArtikelBez und Einzelpreis nur von ArtikelNr. Daher Aufteilung:\n- Rechnung(*RechnungsNr*, Datum, KundenNr, KundenName, KundenOrt)\n- Artikel(*ArtikelNr*, ArtikelBez, Einzelpreis)\n- Rechnungsposition(*RechnungsNr* (FK), *ArtikelNr* (FK), Menge)\n\n3NF: Keine transitiven Abhängigkeiten. In Rechnung hängen KundenName und KundenOrt von KundenNr ab, nicht direkt von RechnungsNr. Daher:\n- Kunde(*KundenNr*, KundenName, KundenOrt)\n- Rechnung(*RechnungsNr*, Datum, KundenNr (FK))\n\nErgebnis: Kunde, Rechnung, Rechnungsposition, Artikel.',
    rubric: [
      { criterion: '1NF korrekt beurteilt (atomare Werte, Primärschlüssel vorhanden)', points: 0.5 },
      { criterion: '2NF: Teilabhängigkeiten erkannt und Artikel sowie Rechnungsposition (mit Menge) abgetrennt', points: 1.5 },
      { criterion: '3NF: transitive Abhängigkeit KundenNr → KundenName/KundenOrt erkannt und Tabelle Kunde ausgelagert', points: 1.5 },
      { criterion: 'Primär- und Fremdschlüssel in den Ergebnistabellen korrekt gekennzeichnet', points: 0.5 },
    ],
    explanation:
      'Die 2NF beseitigt Abhängigkeiten von Teilen eines zusammengesetzten Schlüssels, die 3NF beseitigt Abhängigkeiten zwischen Nichtschlüsselattributen (transitive Abhängigkeiten). Ergebnis sind redundanzfreie Tabellen ohne Änderungsanomalien.',
  },
  {
    id: 'ew-ft-005',
    section: 'entwicklung',
    topic: 'uml',
    type: 'free_text',
    title: 'Aggregation und Komposition',
    scenario:
      'Für die Verwaltungssoftware des Hotels Seeblick modellieren Sie die Klassen Hotel, Zimmer, Gast und Reisegruppe in einem UML-Klassendiagramm.',
    text:
      'Erläutern Sie den Unterschied zwischen **Aggregation** und **Komposition** im UML-Klassendiagramm. Gehen Sie dabei auf die Notation und auf die Lebensdauer der beteiligten Objekte ein und geben Sie je ein passendes Beispiel aus dem Hotelkontext an.',
    points: 4,
    difficulty: 2,
    solution:
      'Aggregation: "Teil-Ganzes"-Beziehung, bei der die Teile unabhängig vom Ganzen existieren können. Notation: Linie mit leerer (weißer) Raute am Ganzen. Beispiel: Reisegruppe – Gast. Wird die Reisegruppe aufgelöst, existieren die Gäste weiter; ein Gast kann auch ohne Gruppe reisen.\n\nKomposition: starke "Teil-Ganzes"-Beziehung, bei der die Teile existenzabhängig vom Ganzen sind und zu genau einem Ganzen gehören. Notation: Linie mit gefüllter (schwarzer) Raute am Ganzen. Beispiel: Hotel – Zimmer. Wird das Hotel aus dem System gelöscht, werden auch seine Zimmer gelöscht; ein Zimmer kann nicht ohne Hotel existieren.',
    rubric: [
      { criterion: 'Aggregation korrekt erläutert (Teile existieren unabhängig vom Ganzen)', points: 1 },
      { criterion: 'Komposition korrekt erläutert (Existenzabhängigkeit, Teil gehört zu genau einem Ganzen)', points: 1 },
      { criterion: 'Notation korrekt: leere Raute (Aggregation) bzw. gefüllte Raute (Komposition) am Ganzen', points: 1 },
      { criterion: 'Zwei passende Beispiele aus dem Hotelkontext', points: 1 },
    ],
    explanation:
      'Beide sind Sonderformen der Assoziation. Merkhilfe: gefüllte Raute = "fest verbunden", das Teil stirbt mit dem Ganzen; leere Raute = lose Zusammenstellung.',
  },

  /* =====================================================================
   * Zuordnung (4 Punkte)
   * ===================================================================== */
  {
    id: 'ew-ma-001',
    section: 'entwicklung',
    topic: 'datentypen',
    type: 'matching',
    title: 'Datentypen und Wertebereiche',
    scenario:
      'Im Entwicklungsteam der Stadtwerke Nordheim wird für eine Zählerstands-App diskutiert, welche Datentypen für welche Werte geeignet sind.',
    text: 'Ordnen Sie jedem Wertebereich bzw. jeder Beschreibung den passenden Datentyp zu.',
    points: 4,
    difficulty: 2,
    left: [
      { id: 'l1', text: '−128 bis 127' },
      { id: 'l2', text: '0 bis 65.535' },
      { id: 'l3', text: '−2.147.483.648 bis 2.147.483.647' },
      { id: 'l4', text: 'Nur die Werte wahr oder falsch' },
      { id: 'l5', text: 'Gleitkommazahl mit 64 Bit (doppelte Genauigkeit)' },
    ],
    right: [
      { id: 'r1', text: '32-Bit-Ganzzahl mit Vorzeichen (int)' },
      { id: 'r2', text: 'boolean' },
      { id: 'r3', text: '8-Bit-Ganzzahl mit Vorzeichen (byte)' },
      { id: 'r4', text: 'double' },
      { id: 'r5', text: '16-Bit-Ganzzahl ohne Vorzeichen (unsigned short)' },
      { id: 'r6', text: '16-Bit-Ganzzahl mit Vorzeichen (short)' },
      { id: 'r7', text: 'float' },
      { id: 'r8', text: '8-Bit-Ganzzahl ohne Vorzeichen (unsigned byte)' },
    ],
    pairs: { l1: 'r3', l2: 'r5', l3: 'r1', l4: 'r2', l5: 'r4' },
    explanation:
      'n Bit mit Vorzeichen: −2^(n−1) bis 2^(n−1) − 1; ohne Vorzeichen: 0 bis 2^n − 1. float hat 32 Bit, double 64 Bit.',
  },
  {
    id: 'ew-ma-002',
    section: 'entwicklung',
    topic: 'oop',
    type: 'matching',
    title: 'Grundbegriffe der Objektorientierung',
    scenario:
      'Ein neuer Auszubildender im Spielestudio PixelForge GmbH soll die Grundbegriffe der objektorientierten Programmierung anhand der Klasse `Spieler` wiederholen.',
    text: 'Ordnen Sie jedem Begriff die passende Beschreibung zu.',
    points: 4,
    difficulty: 1,
    left: [
      { id: 'l1', text: 'Klasse' },
      { id: 'l2', text: 'Objekt' },
      { id: 'l3', text: 'Attribut' },
      { id: 'l4', text: 'Methode' },
      { id: 'l5', text: 'Kapselung' },
      { id: 'l6', text: 'Konstruktor' },
    ],
    right: [
      { id: 'r1', text: 'Bauplan, der Attribute und Methoden festlegt, z. B. `Spieler`' },
      { id: 'r2', text: 'Konkretes Exemplar (Instanz) eines Bauplans, z. B. der Spieler "Lena" mit 120 Punkten' },
      { id: 'r3', text: 'Datenfeld, das den Zustand beschreibt, z. B. `punkte` oder `name`' },
      { id: 'r4', text: 'Operation, die das Verhalten beschreibt, z. B. `punkteHinzufuegen(10)`' },
      { id: 'r5', text: 'Daten sind privat und werden nur über öffentliche Methoden (Getter/Setter) gelesen oder verändert' },
      { id: 'r6', text: 'Spezielle Methode, die beim Erzeugen eines Objekts aufgerufen wird und Startwerte setzt' },
      { id: 'r7', text: 'Methode, die beim Löschen eines Objekts belegte Ressourcen freigibt' },
      { id: 'r8', text: 'Zusammenfassung mehrerer Klassen zu einer Bibliothek bzw. einem Paket' },
    ],
    pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4', l5: 'r5', l6: 'r6' },
    explanation:
      'r7 beschreibt einen Destruktor, r8 ein Paket/Modul – beides keine der gesuchten Grundbegriffe. Kapselung schützt den Objektzustand vor unkontrolliertem Zugriff.',
  },
  {
    id: 'ew-ma-003',
    section: 'entwicklung',
    topic: 'testen',
    type: 'matching',
    title: 'Testverfahren und Teststufen',
    scenario:
      'Die Versicherung Nordstern AG führt vor dem Release einer neuen Schadensmeldungs-App verschiedene Tests durch. Sie sollen die Testarten im Testkonzept korrekt benennen.',
    text: 'Ordnen Sie jedem Testverfahren bzw. jeder Teststufe die zutreffende Beschreibung zu.',
    points: 4,
    difficulty: 2,
    left: [
      { id: 'l1', text: 'Blackbox-Test' },
      { id: 'l2', text: 'Whitebox-Test' },
      { id: 'l3', text: 'Unit-Test' },
      { id: 'l4', text: 'Integrationstest' },
      { id: 'l5', text: 'Systemtest' },
    ],
    right: [
      { id: 'r1', text: 'Prüft das Zusammenspiel mehrerer Komponenten bzw. Module über ihre Schnittstellen' },
      { id: 'r2', text: 'Testfälle werden allein aus der Spezifikation abgeleitet, ohne Kenntnis des Quellcodes' },
      { id: 'r3', text: 'Prüft das vollständige, integrierte System gegen die Anforderungen in einer produktionsnahen Umgebung' },
      { id: 'r4', text: 'Testfälle werden aus der inneren Struktur des Codes abgeleitet, z. B. zur Erreichung einer Zweigüberdeckung' },
      { id: 'r5', text: 'Prüft einzelne Methoden oder Klassen isoliert, meist automatisiert durch den Entwickler' },
      { id: 'r6', text: 'Wiederholung bereits bestandener Tests nach einer Änderung, um Nebenwirkungen auszuschließen' },
      { id: 'r7', text: 'Der Auftraggeber prüft, ob das System seinen vertraglichen Anforderungen entspricht' },
    ],
    pairs: { l1: 'r2', l2: 'r4', l3: 'r5', l4: 'r1', l5: 'r3' },
    explanation:
      'Blackbox/Whitebox beschreiben die Testmethode, Unit-/Integrations-/Systemtest die Teststufe. r6 ist der Regressionstest, r7 der Abnahmetest.',
  },
  {
    id: 'ew-ma-004',
    section: 'entwicklung',
    topic: 'uml',
    type: 'matching',
    title: 'Notation im UML-Klassendiagramm',
    scenario:
      'Sie prüfen das Klassendiagramm der Bibliotheksverwaltung "LibraNet" auf korrekte Notation, bevor es an das Entwicklungsteam übergeben wird.',
    text: 'Ordnen Sie jedem Notationselement des Klassendiagramms seine Bedeutung zu.',
    points: 4,
    difficulty: 2,
    left: [
      { id: 'l1', text: 'Zeichen − vor einem Attribut' },
      { id: 'l2', text: 'Zeichen # vor einer Methode' },
      { id: 'l3', text: 'Linie mit gefüllter Raute an einem Ende' },
      { id: 'l4', text: 'Linie mit leerer Raute an einem Ende' },
      { id: 'l5', text: 'Gestrichelte Linie mit offener Pfeilspitze' },
      { id: 'l6', text: 'Angabe 1..* an einem Assoziationsende' },
    ],
    right: [
      { id: 'r1', text: 'Aggregation' },
      { id: 'r2', text: 'Sichtbarkeit private' },
      { id: 'r3', text: 'Komposition' },
      { id: 'r4', text: 'Sichtbarkeit protected' },
      { id: 'r5', text: 'Gerichtete Assoziation (Navigierbarkeit)' },
      { id: 'r6', text: 'Multiplizität: mindestens eins, beliebig viele' },
      { id: 'r7', text: 'Sichtbarkeit public' },
      { id: 'r8', text: 'Multiplizität: null oder eins' },
      { id: 'r9', text: 'Abhängigkeit (Dependency)' },
    ],
    pairs: { l1: 'r2', l2: 'r4', l3: 'r3', l4: 'r1', l5: 'r9', l6: 'r6' },
    explanation:
      'Sichtbarkeiten: + public, − private, # protected, ~ package. Die Raute steht immer auf der Seite des Ganzen. Eine Abhängigkeit (z. B. eine Klasse nutzt eine andere nur als Parameter) wird gestrichelt mit offener Pfeilspitze gezeichnet.',
  },

  /* =====================================================================
   * Lückentext (3 Punkte)
   * ===================================================================== */
  {
    id: 'ew-cl-001',
    section: 'entwicklung',
    topic: 'algorithmen',
    type: 'cloze',
    title: 'Pseudocode Bubble Sort vervollständigen',
    scenario:
      'Für die Rangliste eines Laufwettbewerbs des Sportvereins TSV Eichenhain sollen die Zielzeiten sortiert werden. Ein Kollege hat den Bubble-Sort-Algorithmus in Pseudocode notiert, einige Stellen fehlen jedoch.',
    text:
      'Ergänzen Sie die Lücken so, dass der Algorithmus die Liste korrekt **aufsteigend** sortiert (kleinste Zeit zuerst). Der Index der Liste beginnt bei 0.',
    points: 3,
    difficulty: 2,
    template:
      'FUNKTION bubbleSort(liste)\n  n = LÄNGE(liste)\n  FÜR i VON 0 BIS n - 2\n    FÜR j VON 0 BIS n - {{b1}} - i\n      WENN liste[j] {{b2}} liste[j + 1] DANN\n        tausche liste[j] und liste[j + 1]\n      ENDE WENN\n    ENDE FÜR\n  ENDE FÜR\nENDE FUNKTION\n\nNach dem ersten Durchlauf der äußeren Schleife steht das {{b3}} Element garantiert an seiner endgültigen Position. Im schlechtesten Fall hat Bubble Sort die Zeitkomplexität {{b4}}.',
    blanks: [
      { id: 'b1', accepted: ['2'] },
      { id: 'b2', accepted: ['>'], options: ['>', '<', '==', '!=', '>='] },
      { id: 'b3', accepted: ['größte'], options: ['größte', 'kleinste', 'mittlere', 'erste'] },
      { id: 'b4', accepted: ['O(n²)', 'O(n^2)', 'O(n*n)', 'O(n·n)', 'n²', 'n^2', 'quadratisch'] },
    ],
    explanation:
      'Die innere Schleife vergleicht Nachbarn bis zum Index n − 2 − i, weil die letzten i Elemente bereits sortiert sind. Bei aufsteigender Sortierung wird getauscht, wenn das linke Element größer ist; das größte Element "blubbert" pro Durchlauf ans Ende. Zwei verschachtelte Schleifen ergeben O(n²).',
  },
  {
    id: 'ew-cl-002',
    section: 'entwicklung',
    topic: 'aktivitaetsdiagramm',
    type: 'cloze',
    title: 'Notation im UML-Aktivitätsdiagramm',
    scenario: 'Für die Freigabe von Urlaubsanträgen im Personalportal der Klinikum Südstadt gGmbH soll der Ablauf als UML-Aktivitätsdiagramm dokumentiert werden.',
    text: 'Ergänzen Sie den Text.',
    points: 3,
    difficulty: 1,
    template:
      'Ein Aktivitätsdiagramm beginnt mit dem {{b1}} (ausgefüllter Kreis) und endet mit dem {{b2}} (ausgefüllter Kreis mit Ring). Einzelne Arbeitsschritte werden als {{b3}} in abgerundeten Rechtecken dargestellt. Eine Verzweigung wird durch eine {{b4}} dargestellt; die ausgehenden Kanten tragen Bedingungen (Guards) in {{b5}}. Parallel laufende Abläufe werden mit einem Synchronisationsbalken (Gabelung/Fork) gestartet und wieder zusammengeführt.',
    blanks: [
      { id: 'b1', accepted: ['Startknoten', 'Startpunkt', 'Initialknoten'] },
      { id: 'b2', accepted: ['Endknoten', 'Aktivitätsendknoten', 'Endpunkt'], options: ['Endknoten', 'Entscheidungsknoten', 'Objektknoten', 'Zusammenführung', 'Ablaufende'] },
      { id: 'b3', accepted: ['Aktionen', 'Aktion', 'Aktivitäten'], options: ['Aktionen', 'Zustände', 'Akteure', 'Klassen', 'Objekte'] },
      { id: 'b4', accepted: ['Raute', 'Entscheidungsknoten'], options: ['Raute', 'Ellipse', 'Rechteck', 'Balken', 'Wolke'] },
      { id: 'b5', accepted: ['eckigen Klammern', 'eckige Klammern'], options: ['eckigen Klammern', 'runden Klammern', 'geschweiften Klammern', 'Anführungszeichen', 'spitzen Klammern'] },
    ],
    explanation: 'Aktivitätsdiagramme modellieren Abläufe: Startknoten, Aktionen, Entscheidungs-/Zusammenführungsknoten (Raute) mit Guards in eckigen Klammern, Gabelung/Vereinigung (Balken) und Endknoten.',
  },
  {
    id: 'ew-cl-003',
    section: 'entwicklung',
    topic: 'normalisierung',
    type: 'cloze',
    title: 'Normalformen relationaler Datenbanken',
    scenario:
      'Die Tierklinik Am Waldrand lässt ihre Patientendatenbank neu entwerfen. In der Dokumentation soll das Normalisierungskonzept kurz beschrieben werden.',
    text: 'Ergänzen Sie den Text zu den Normalformen.',
    points: 3,
    difficulty: 2,
    template:
      'Eine Relation befindet sich in der {{b1}}. Normalform, wenn alle Attributwerte atomar sind. Die 2. Normalform verlangt zusätzlich, dass jedes Nichtschlüsselattribut vom {{b2}} Primärschlüssel funktional abhängt; Teilabhängigkeiten können daher nur bei einem {{b3}} Primärschlüssel auftreten. Die 3. Normalform verbietet zusätzlich {{b4}} Abhängigkeiten, also Abhängigkeiten eines Nichtschlüsselattributs von einem anderen Nichtschlüsselattribut. Ein Attribut, das auf den Primärschlüssel einer anderen Tabelle verweist, wird als {{b5}} bezeichnet.',
    blanks: [
      { id: 'b1', accepted: ['1', 'ersten', 'erste'] },
      { id: 'b2', accepted: ['gesamten', 'vollständigen'], options: ['gesamten', 'künstlichen', 'alternativen', 'ersten'] },
      { id: 'b3', accepted: ['zusammengesetzten'], options: ['zusammengesetzten', 'künstlichen', 'numerischen', 'einfachen'] },
      { id: 'b4', accepted: ['transitive'], options: ['transitive', 'funktionale', 'partielle', 'mehrwertige'] },
      { id: 'b5', accepted: ['Fremdschlüssel', 'Foreign Key', 'Fremdschluessel'] },
    ],
    explanation:
      '1NF: atomare Werte. 2NF: keine Abhängigkeit von nur einem Teil des (zusammengesetzten) Schlüssels. 3NF: keine transitiven Abhängigkeiten. Fremdschlüssel stellen die Beziehungen zwischen den normalisierten Tabellen her.',
  },
  {
    id: 'ew-cl-004',
    section: 'entwicklung',
    topic: 'uml',
    type: 'cloze',
    title: 'Sichtbarkeiten im Klassendiagramm',
    scenario:
      'Im Reisebüro Sonnenweg wird die Klasse `Buchung` modelliert. Sie erklären einer Praktikantin die Sichtbarkeitsregeln im UML-Klassendiagramm.',
    text: 'Ergänzen Sie den Text.',
    points: 3,
    difficulty: 1,
    template:
      'Im UML-Klassendiagramm wird ein privates Attribut mit dem Zeichen {{b1}} gekennzeichnet, ein geschütztes (protected) Element mit {{b2}} und ein öffentliches Element mit {{b3}}. Ein protected-Attribut ist innerhalb der Klasse selbst und in {{b4}} sichtbar. Ein Klassenattribut (statisches Attribut) wird im Diagramm {{b5}} dargestellt.',
    blanks: [
      { id: 'b1', accepted: ['-', '−', '–', 'Minus', 'minus'] },
      { id: 'b2', accepted: ['#', 'Raute', 'Doppelkreuz'] },
      { id: 'b3', accepted: ['+', 'Plus', 'plus'] },
      { id: 'b4', accepted: ['ihren Unterklassen'], options: ['ihren Unterklassen', 'allen Klassen des Programms', 'keiner anderen Klasse', 'nur in derselben Methode'] },
      { id: 'b5', accepted: ['unterstrichen'], options: ['unterstrichen', 'kursiv', 'fett', 'in geschweiften Klammern'] },
    ],
    explanation:
      'Sichtbarkeiten: + public, − private, # protected, ~ package. Statische Elemente werden unterstrichen.',
  },

  /* =====================================================================
   * Multiple Choice (2 Punkte)
   * ===================================================================== */
  {
    id: 'ew-mc-001',
    section: 'entwicklung',
    topic: 'zahlensysteme',
    type: 'multiple_choice',
    title: 'Zweierkomplement interpretieren',
    scenario:
      'Ein Sensor der SensoLab UG liefert Temperaturwerte als 8-Bit-Zweierkomplement. Im Debugger sehen Sie das Bitmuster `1111 0110`.',
    text: 'Welchem Dezimalwert entspricht das Bitmuster `1111 0110` als vorzeichenbehaftete 8-Bit-Zahl im Zweierkomplement?',
    points: 2,
    difficulty: 2,
    options: [
      { id: 'a', text: '246' },
      { id: 'b', text: '−10' },
      { id: 'c', text: '−118' },
      { id: 'd', text: '−9' },
    ],
    correct: ['b'],
    multi: false,
    explanation:
      'Das höchste Bit ist 1, also negativ. Invertieren: 0000 1001, plus 1: 0000 1010 = 10 → Wert −10. 246 wäre die vorzeichenlose Interpretation, −118 die (falsche) Vorzeichen-Betrag-Interpretation.',
  },
  {
    id: 'ew-mc-002',
    section: 'entwicklung',
    topic: 'zahlensysteme',
    type: 'multiple_choice',
    title: 'Binär nach Hexadezimal',
    scenario:
      'In einem Protokoll-Log des Autohauses Weber GmbH werden Statusbytes hexadezimal ausgegeben. Sie wollen das Byte `1010 1111` von Hand überprüfen.',
    text: 'Welcher Hexadezimalwert entspricht dem Bitmuster `1010 1111`?',
    points: 2,
    difficulty: 1,
    options: [
      { id: 'a', text: 'FA' },
      { id: 'b', text: 'A15' },
      { id: 'c', text: 'AF' },
      { id: 'd', text: '9F' },
    ],
    correct: ['c'],
    multi: false,
    explanation:
      'Jede Vierergruppe (Nibble) entspricht einer Hex-Ziffer: 1010 = A, 1111 = F → AF (dezimal 175).',
  },
  {
    id: 'ew-mc-003',
    section: 'entwicklung',
    topic: 'ki',
    type: 'multiple_choice',
    title: 'Generative KI in der Softwareentwicklung',
    scenario: 'Das Entwicklungsteam der Logistik-Software "RouteMaster" möchte einen KI-gestützten Code-Assistenten einsetzen.',
    text: 'Welche Aussagen zum Einsatz generativer KI (z. B. Code-Assistenten, Chatbots) treffen zu? (Mehrere Antworten möglich)',
    points: 2,
    difficulty: 2,
    options: [
      { id: 'a', text: 'KI-generierter Code muss geprüft und getestet werden, da Sprachmodelle plausibel wirkende, aber fehlerhafte Ausgaben erzeugen können ("Halluzinationen").' },
      { id: 'b', text: 'Vertrauliche Kunden- oder Quellcodedaten dürfen ohne Freigabe nicht in öffentliche KI-Dienste eingegeben werden.' },
      { id: 'c', text: 'Ein Sprachmodell versteht die Programmlogik vollständig und liefert deshalb immer korrekten Code.' },
      { id: 'd', text: 'Die Qualität der Ausgabe hängt wesentlich von der Formulierung und dem Kontext der Eingabe (Prompt) ab.' },
      { id: 'e', text: 'KI-generierter Code ist automatisch frei von Urheber- und Lizenzproblemen.' },
    ],
    correct: ['a', 'b', 'd'],
    multi: true,
    explanation: 'Sprachmodelle erzeugen wahrscheinliche Fortsetzungen, keine garantiert korrekten Lösungen. Daher gelten Review- und Testpflicht, Datenschutz-/Geheimhaltungsregeln für Eingaben und sorgfältiges Prompting.',
  },
  {
    id: 'ew-mc-004',
    section: 'entwicklung',
    topic: 'testen',
    type: 'multiple_choice',
    title: 'Blackbox-Test',
    scenario:
      'Die Bäckerei-Kette Krümel & Co. lässt ihre Bestell-App von einer externen Testfirma prüfen, die keinen Zugriff auf den Quellcode erhält.',
    text: 'Welche Aussage zum Blackbox-Test ist korrekt?',
    points: 2,
    difficulty: 1,
    options: [
      { id: 'a', text: 'Die Testfälle werden aus der Spezifikation abgeleitet; das Ein-/Ausgabeverhalten wird ohne Kenntnis des Codes geprüft.' },
      { id: 'b', text: 'Ziel ist es, eine möglichst hohe Anweisungs- und Zweigüberdeckung des Quellcodes zu erreichen.' },
      { id: 'c', text: 'Der Test kann nur von den Entwicklern durchgeführt werden, die den Code geschrieben haben.' },
      { id: 'd', text: 'Es werden ausschließlich nicht-funktionale Anforderungen wie Performance geprüft.' },
    ],
    correct: ['a'],
    multi: false,
    explanation:
      'Beim Blackbox-Test ist der innere Aufbau unbekannt; getestet wird gegen die Anforderungen. Überdeckungsmaße gehören zum Whitebox-Test.',
  },
  {
    id: 'ew-mc-005',
    section: 'entwicklung',
    topic: 'versionsverwaltung',
    type: 'multiple_choice',
    title: 'Grundbegriffe von Git',
    scenario:
      'Das Entwicklungsteam der Logistik-Software "RouteMaster" stellt die Versionsverwaltung auf Git um. Sie bereiten eine kurze Einführung vor.',
    text: 'Welche Aussagen zu Git sind korrekt? (Mehrere Antworten möglich)',
    points: 2,
    difficulty: 1,
    options: [
      { id: 'a', text: 'Ein `commit` speichert einen Änderungsstand dauerhaft im lokalen Repository.' },
      { id: 'b', text: 'Mit `branch` können unabhängige Entwicklungslinien angelegt werden, die später mit `merge` zusammengeführt werden.' },
      { id: 'c', text: 'Ein `commit` überträgt die Änderungen automatisch auf den zentralen Server.' },
      { id: 'd', text: '`push` überträgt lokale Commits in ein entferntes Repository (Remote).' },
      { id: 'e', text: 'Git funktioniert nur, wenn ständig eine Verbindung zu einem zentralen Server besteht.' },
    ],
    correct: ['a', 'b', 'd'],
    multi: true,
    explanation:
      'Git ist ein verteiltes Versionsverwaltungssystem: Commits erfolgen lokal, erst push/pull synchronisieren mit dem Remote. Branches ermöglichen paralleles Arbeiten.',
  },
  {
    id: 'ew-mc-006',
    section: 'entwicklung',
    topic: 'algorithmen',
    type: 'multiple_choice',
    title: 'Rekursion',
    scenario:
      'Für die Berechnung von Zinseszinsen in der Banking-App der Nordstern AG hat ein Kollege eine rekursive Funktion geschrieben, die zu einem Stack Overflow führt.',
    text: 'Welche Eigenschaft muss eine korrekt arbeitende rekursive Funktion zwingend besitzen?',
    points: 2,
    difficulty: 1,
    options: [
      { id: 'a', text: 'Sie muss mindestens eine Schleife (for/while) enthalten.' },
      { id: 'b', text: 'Sie muss eine Abbruchbedingung (Basisfall) besitzen, bei der kein weiterer Selbstaufruf erfolgt.' },
      { id: 'c', text: 'Sie darf keine Parameter besitzen, damit der Aufrufstack klein bleibt.' },
      { id: 'd', text: 'Sie muss als statische Methode deklariert sein.' },
    ],
    correct: ['b'],
    multi: false,
    explanation:
      'Ohne Basisfall ruft sich die Funktion endlos selbst auf, bis der Stack überläuft. Rekursion und Schleifen schließen sich nicht aus, sind aber voneinander unabhängig.',
  },
  {
    id: 'ew-mc-007',
    section: 'entwicklung',
    topic: 'datenbanken',
    type: 'multiple_choice',
    title: 'Primärschlüssel',
    scenario:
      'Beim Entwurf der Tabelle `mitglied` für den Sportverein TSV Eichenhain soll ein Primärschlüssel festgelegt werden.',
    text: 'Welche Aussage zum Primärschlüssel einer relationalen Tabelle ist korrekt?',
    points: 2,
    difficulty: 1,
    options: [
      { id: 'a', text: 'Der Primärschlüssel darf NULL sein, wenn für einen Datensatz noch kein Wert bekannt ist.' },
      { id: 'b', text: 'Der Primärschlüssel identifiziert jeden Datensatz eindeutig und darf nicht NULL sein.' },
      { id: 'c', text: 'Der Primärschlüssel darf mehrfach vorkommen, solange die übrigen Attribute unterschiedlich sind.' },
      { id: 'd', text: 'Der Primärschlüssel muss immer aus genau einem numerischen Attribut bestehen.' },
    ],
    correct: ['b'],
    multi: false,
    explanation:
      'Primärschlüssel: eindeutig, nicht NULL, unveränderlich. Er kann auch aus mehreren Attributen zusammengesetzt sein (z. B. in Beziehungstabellen).',
  },
  {
    id: 'ew-mc-008',
    section: 'entwicklung',
    topic: 'codequalitaet',
    type: 'multiple_choice',
    title: 'Clean Code und Wartbarkeit',
    scenario:
      'Nach einem Code-Review bei der Immobilienverwaltung Domus GmbH sollen Regeln für sauberen, wartbaren Code im Team vereinbart werden.',
    text: 'Welche Maßnahmen verbessern die Lesbarkeit und Wartbarkeit von Quellcode? (Mehrere Antworten möglich)',
    points: 2,
    difficulty: 1,
    options: [
      { id: 'a', text: 'Sprechende Bezeichner für Variablen und Methoden verwenden (z. B. `bruttoPreis` statt `x1`).' },
      { id: 'b', text: 'Möglichst viele globale Variablen nutzen, um Parameterübergaben zu sparen.' },
      { id: 'c', text: 'Funktionen kurz halten und jede Funktion auf genau eine Aufgabe beschränken.' },
      { id: 'd', text: 'Jede Codezeile mit einem Kommentar versehen, der wiederholt, was die Zeile tut.' },
      { id: 'e', text: 'Feste Zahlenwerte ("Magic Numbers") durch benannte Konstanten ersetzen.' },
    ],
    correct: ['a', 'c', 'e'],
    multi: true,
    explanation:
      'Globale Variablen erzeugen versteckte Abhängigkeiten; redundante Kommentare veralten schnell und erhöhen den Pflegeaufwand. Sprechende Namen, kleine Funktionen und Konstanten sind zentrale Clean-Code-Prinzipien.',
  },
  {
    id: 'ew-mc-009',
    section: 'entwicklung',
    topic: 'algorithmen',
    type: 'multiple_choice',
    title: 'Binäre Suche',
    scenario:
      'Die Bibliotheksverwaltung "LibraNet" sucht Medien in einer nach ISBN sortierten Liste mit 1.000.000 Einträgen per binärer Suche.',
    text: 'Welche Aussage zur binären Suche ist korrekt?',
    points: 2,
    difficulty: 2,
    options: [
      { id: 'a', text: 'Sie funktioniert auch auf unsortierten Listen und hat eine Laufzeit von O(n).' },
      { id: 'b', text: 'Sie setzt eine sortierte Liste voraus und halbiert den Suchbereich in jedem Schritt; Laufzeit O(log n).' },
      { id: 'c', text: 'Sie vergleicht jedes Element der Reihe nach mit dem Suchwert; Laufzeit O(n log n).' },
      { id: 'd', text: 'Sie setzt eine sortierte Liste voraus und hat eine Laufzeit von O(n²).' },
    ],
    correct: ['b'],
    multi: false,
    explanation:
      'Bei 1.000.000 Einträgen benötigt die binäre Suche höchstens etwa 20 Vergleiche (2^20 ≈ 1.048.576), die lineare Suche im schlechtesten Fall 1.000.000.',
  },

  /* =====================================================================
   * Multiple Choice (3 Punkte)
   * ===================================================================== */
  {
    id: 'ew-mc-010',
    section: 'entwicklung',
    topic: 'kontrollstrukturen',
    type: 'multiple_choice',
    title: 'Ablauf eines Programms nachvollziehen',
    scenario:
      'Im Code der Zählerstands-App der Stadtwerke Nordheim finden Sie folgende Methode ohne Kommentar. Sie sollen prüfen, was sie berechnet.',
    text:
      'Gegeben ist folgender Codeausschnitt (Ganzzahldivision, `%` = Modulo):\n\n`int x = 5;\nint y = 0;\nwhile (x > 0) {\n    y = y + x % 2;\n    x = x / 2;\n}\nSystem.out.println(y);`\n\nWelche Ausgabe erzeugt der Code?',
    points: 3,
    difficulty: 3,
    options: [
      { id: 'a', text: '0' },
      { id: 'b', text: '2' },
      { id: 'c', text: '3' },
      { id: 'd', text: '5' },
    ],
    correct: ['b'],
    multi: false,
    explanation:
      'Durchlauf 1: y = 0 + 1 = 1, x = 2. Durchlauf 2: y = 1 + 0 = 1, x = 1. Durchlauf 3: y = 1 + 1 = 2, x = 0 → Ausgabe 2. Die Methode zählt die Einsen in der Binärdarstellung von x (5 = 101).',
  },
  {
    id: 'ew-mc-011',
    section: 'entwicklung',
    topic: 'schreibtischtest',
    type: 'multiple_choice',
    title: 'Ausgabe verschachtelter Schleifen bestimmen',
    scenario: 'Im Code-Review der Buchhandlung Leseinsel soll die Ausgabe eines kleinen Pseudocode-Programms per Schreibtischtest bestimmt werden.',
    text:
      '`zaehler = 0`\n`FÜR i = 1 BIS 4`\n`  FÜR j = i BIS 4`\n`    WENN (i + j) MOD 2 = 0 DANN`\n`      zaehler = zaehler + 1`\n`    ENDE WENN`\n`  ENDE FÜR`\n`ENDE FÜR`\n`AUSGABE zaehler`\n\nWelchen Wert gibt das Programm aus?',
    points: 3,
    difficulty: 3,
    options: [
      { id: 'a', text: '4' },
      { id: 'b', text: '6' },
      { id: 'c', text: '8' },
      { id: 'd', text: '10' },
      { id: 'e', text: '16' },
    ],
    correct: ['b'],
    multi: false,
    explanation: 'Die innere Schleife beginnt bei j = i, es werden also nur Paare mit i ≤ j betrachtet (10 Paare). Gerade Summe haben (1,1), (1,3), (2,2), (2,4), (3,3), (4,4) – also 6.',
  },
  {
    id: 'ew-mc-012',
    section: 'entwicklung',
    topic: 'normalisierung',
    type: 'multiple_choice',
    title: 'Normalformen beurteilen',
    scenario:
      'Die Bäckerei-Kette Krümel & Co. speichert Filialbestellungen in einer Tabelle mit dem zusammengesetzten Primärschlüssel (BestellNr, ArtikelNr):\n\n| BestellNr | Datum | FilialNr | FilialOrt | ArtikelNr | ArtikelBez | Menge',
    text:
      'Es gelten die funktionalen Abhängigkeiten: BestellNr → Datum, FilialNr; FilialNr → FilialOrt; ArtikelNr → ArtikelBez; (BestellNr, ArtikelNr) → Menge.\n\nWelche Aussagen sind korrekt? (Mehrere Antworten möglich)',
    points: 3,
    difficulty: 3,
    options: [
      { id: 'a', text: 'Die Tabelle befindet sich in der 1. Normalform, da alle Attributwerte atomar sind und ein Primärschlüssel existiert.' },
      { id: 'b', text: 'ArtikelBez hängt nur von einem Teil des Schlüssels (ArtikelNr) ab; die 2. Normalform ist verletzt.' },
      { id: 'c', text: 'FilialOrt hängt transitiv über FilialNr vom Schlüssel ab; die 3. Normalform ist verletzt.' },
      { id: 'd', text: 'Menge verletzt die 2. Normalform, da sie vom gesamten Schlüssel abhängt.' },
      { id: 'e', text: 'Die Tabelle befindet sich bereits in der 3. Normalform.' },
    ],
    correct: ['a', 'b', 'c'],
    multi: true,
    explanation:
      'Datum, FilialNr und ArtikelBez hängen jeweils nur von einem Teil des Schlüssels ab (2NF verletzt); FilialOrt hängt vom Nichtschlüsselattribut FilialNr ab (3NF verletzt). Menge hängt korrekt vom gesamten Schlüssel ab – das ist genau die Anforderung der 2NF, keine Verletzung.',
  },

  /* =====================================================================
   * Rechenaufgaben (5 Punkte)
   * ===================================================================== */
  {
    id: 'ew-ca-001',
    section: 'entwicklung',
    topic: 'zahlensysteme',
    type: 'calculation',
    title: 'Zahlensysteme und Zweierkomplement',
    scenario:
      'Für ein Steuergerät der Autohaus Weber GmbH programmieren Sie eine Schnittstelle, die Temperaturwerte als vorzeichenbehaftete 8-Bit-Zahlen (Zweierkomplement) überträgt.',
    text:
      'a) Wandeln Sie die Dezimalzahl **202** in das Binärsystem (8 Bit) und in das Hexadezimalsystem um.\nb) Stellen Sie die Dezimalzahl **−45** als 8-Bit-Zweierkomplement dar (binär und hexadezimal).\nc) Geben Sie den Wertebereich an, der mit 8 Bit im Zweierkomplement darstellbar ist.\n\nGeben Sie jeweils den vollständigen Rechenweg an.',
    points: 5,
    difficulty: 2,
    solution:
      'a) 202 = 128 + 64 + 8 + 2 → Stellenwerte 128 64 32 16 8 4 2 1 → 1 1 0 0 1 0 1 0\nBinär: 1100 1010\nHex: 1100 = C, 1010 = A → CA (Kontrolle: 12 × 16 + 10 = 202)\n\nb) Betrag 45 = 32 + 8 + 4 + 1 → 0010 1101\nBitweise invertieren (Einerkomplement): 1101 0010\nPlus 1: 1101 0011\nHex: 1101 = D, 0011 = 3 → D3 (Kontrolle: 256 − 45 = 211 = D3)\n\nc) Wertebereich 8 Bit Zweierkomplement: −2^7 bis 2^7 − 1 = −128 bis +127',
    expected: [
      { label: '202 binär (Bitfolge)', value: 11001010, tolerance: 0 },
      { label: '−45 als Zweierkomplement (Bitfolge)', value: 11010011, tolerance: 0 },
      { label: 'Untere Grenze Wertebereich', value: -128, tolerance: 0 },
      { label: 'Obere Grenze Wertebereich', value: 127, tolerance: 0 },
    ],
    rubric: [
      { criterion: 'a) Binärdarstellung 1100 1010 mit nachvollziehbarem Rechenweg', points: 1 },
      { criterion: 'a) Hexadezimaldarstellung CA', points: 1 },
      { criterion: 'b) Zweierkomplement korrekt gebildet (Betrag → invertieren → +1) mit Ergebnis 1101 0011 / D3', points: 2 },
      { criterion: 'c) Wertebereich −128 bis 127', points: 1 },
    ],
    explanation:
      'Das Zweierkomplement einer negativen Zahl entsteht durch Invertieren aller Bits des Betrags und Addition von 1. Mit n Bit sind Werte von −2^(n−1) bis 2^(n−1) − 1 darstellbar.',
  },
  {
    id: 'ew-ca-002',
    section: 'entwicklung',
    topic: 'speicherbedarf',
    type: 'calculation',
    title: 'Speicherbedarf einer Messwerttabelle',
    scenario:
      'Die SensoLab UG speichert Messwerte von Temperatursensoren in einer Datenbanktabelle. Die Kapazität des Datenbankservers soll für ein Jahr geplant werden.',
    text:
      'Die Tabelle `messwert` hat folgende Spalten:\n\n| Spalte | Datentyp | Größe\n| id | INT | 4 Byte\n| sensor_id | SMALLINT | 2 Byte\n| zeitstempel | BIGINT | 8 Byte\n| wert | DOUBLE | 8 Byte\n| status | CHAR(2) | 2 Byte\n\nEs sind **50 Sensoren** im Einsatz, jeder liefert **alle 10 Sekunden** einen Messwert. Ein Jahr wird mit 365 Tagen gerechnet; Indizes und Verwaltungsdaten werden vernachlässigt.\n\na) Berechnen Sie die Größe eines Datensatzes in Byte.\nb) Berechnen Sie die Anzahl der Datensätze, die in einem Jahr anfallen.\nc) Berechnen Sie den Speicherbedarf für ein Jahr in GiB (1 GiB = 1024³ Byte). Runden Sie auf zwei Nachkommastellen.',
    points: 5,
    difficulty: 2,
    solution:
      'a) 4 + 2 + 8 + 8 + 2 = 24 Byte je Datensatz\n\nb) Messwerte je Sensor und Tag: 86.400 s / 10 s = 8.640\nJe Sensor und Jahr: 8.640 × 365 = 3.153.600\nAlle Sensoren: 3.153.600 × 50 = 157.680.000 Datensätze\n\nc) 157.680.000 × 24 Byte = 3.784.320.000 Byte\n3.784.320.000 / 1.073.741.824 ≈ 3,52 GiB',
    expected: [
      { label: 'Datensatzgröße', value: 24, unit: 'Byte', tolerance: 0 },
      { label: 'Datensätze pro Jahr', value: 157680000, tolerance: 0 },
      { label: 'Speicherbedarf pro Jahr', value: 3.52, unit: 'GiB', tolerance: 0.02 },
    ],
    rubric: [
      { criterion: 'a) Datensatzgröße 24 Byte', points: 1 },
      { criterion: 'b) Anzahl Datensätze 157.680.000 mit nachvollziehbarem Rechenweg (8.640 je Tag, 365 Tage, 50 Sensoren)', points: 2 },
      { criterion: 'c) Gesamtbyte 3.784.320.000 und Umrechnung mit Basis 1024³ auf ≈ 3,52 GiB', points: 2 },
    ],
    explanation:
      'Datensatzgröße × Anzahl Datensätze ergibt den Rohspeicherbedarf; wegen der Binärpräfixe muss durch 1024³ (nicht 1000³) geteilt werden. In dezimalen GB wären es ≈ 3,78 GB.',
  },
  {
    id: 'ew-ca-003',
    section: 'entwicklung',
    topic: 'algorithmen',
    type: 'calculation',
    title: 'Algorithmus per Ablaufverfolgung auswerten',
    scenario:
      'Im Kassensystem der Möbelhaus Holzwurm GmbH wurden zwei Hilfsfunktionen ohne Dokumentation gefunden. Sie sollen deren Ergebnis durch eine Ablaufverfolgung (Trace-Tabelle) bestimmen.',
    text:
      'a) Gegeben ist folgender Pseudocode (Indizes beginnen bei 0, `MOD` = Rest der Ganzzahldivision):\n\n`zahlen = [4, 7, 1, 9, 3]\nsumme = 0\nzaehler = 0\nFÜR i VON 0 BIS 4\n  WENN zahlen[i] MOD 2 = 1 DANN\n    summe = summe + zahlen[i]\n    zaehler = zaehler + 1\n  ENDE WENN\nENDE FÜR\nAUSGABE summe, zaehler, summe / zaehler`\n\nErstellen Sie eine Trace-Tabelle mit den Werten von `i`, `zahlen[i]`, `summe` und `zaehler` nach jedem Schleifendurchlauf und geben Sie die Ausgabe an.\n\nb) Gegeben ist folgender Pseudocode:\n\n`a = 84\nb = 36\nSOLANGE b ≠ 0\n  r = a MOD b\n  a = b\n  b = r\nENDE SOLANGE\nAUSGABE a`\n\nErmitteln Sie mit einer Trace-Tabelle die Ausgabe und die Anzahl der Schleifendurchläufe.',
    points: 5,
    difficulty: 3,
    solution:
      'a) Trace-Tabelle:\n| i | zahlen[i] | Bedingung | summe | zaehler\n| 0 | 4 | falsch | 0 | 0\n| 1 | 7 | wahr | 7 | 1\n| 2 | 1 | wahr | 8 | 2\n| 3 | 9 | wahr | 17 | 3\n| 4 | 3 | wahr | 20 | 4\nAusgabe: 20, 4, 5 (Summe, Anzahl und Durchschnitt der ungeraden Zahlen)\n\nb) Trace-Tabelle:\n| Durchlauf | a | b | r = a MOD b | a neu | b neu\n| 1 | 84 | 36 | 12 | 36 | 12\n| 2 | 36 | 12 | 0 | 12 | 0\nb = 0 → Schleife endet. Ausgabe: 12 (größter gemeinsamer Teiler, euklidischer Algorithmus), 2 Schleifendurchläufe.',
    expected: [
      { label: 'a) summe', value: 20, tolerance: 0 },
      { label: 'a) zaehler', value: 4, tolerance: 0 },
      { label: 'a) summe / zaehler', value: 5, tolerance: 0 },
      { label: 'b) Ausgabe a', value: 12, tolerance: 0 },
      { label: 'b) Schleifendurchläufe', value: 2, tolerance: 0 },
    ],
    rubric: [
      { criterion: 'a) Trace-Tabelle mit korrekten Zwischenwerten je Durchlauf (nur ungerade Zahlen werden addiert)', points: 1.5 },
      { criterion: 'a) Ausgabe 20, 4, 5 korrekt', points: 1.5 },
      { criterion: 'b) Zwischenwerte der Durchläufe korrekt (84/36 → 12, 36/12 → 0)', points: 1 },
      { criterion: 'b) Ausgabe 12 und 2 Schleifendurchläufe', points: 1 },
    ],
    explanation:
      'a) berechnet Summe, Anzahl und Mittelwert der ungeraden Elemente. b) ist der euklidische Algorithmus zur Bestimmung des größten gemeinsamen Teilers: ggT(84, 36) = 12.',
  },
];
