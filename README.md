# AP1 – Digitale Abschlussprüfung Teil 1 (FIAE)

Web-App zur Simulation der IHK-Abschlussprüfung Teil 1 „Einrichten eines IT-gestützten Arbeitsplatzes“
für Fachinformatiker/-innen Anwendungsentwicklung: 5 Handlungsschritte, 100 Punkte, 90 Minuten.
Inhaltliche Basis ist die **2. Auflage des Prüfungskatalogs der ZPA Nord-West** (gültig ab Frühjahr 2025): SQL, RAID/SAN,
Struktogramme/PAP und Vererbung sind nicht mehr Teil der AP1; neu sind u. a. BPMN, KI-Grundlagen,
Aktivitätsdiagramme, Schreibtischtest, ERP/CRM, Hashing, Härtung und Anonymisierung/Pseudonymisierung.
Quellen, Themenkreise und Abweichungen vom Originalformat: `docs/pruefungskatalog.md`.

## Funktionen

- Registrierung und Login (bcrypt, JWT-Cookie), Prüfungsversuche werden pro Nutzer gespeichert
- **Prüfungsordnung** (`server/src/exam/blueprint.ts`): feste Slot-Struktur je Handlungsschritt,
  jede Prüfung wird daraus zufällig aus dem Katalog zusammengestellt (Wiederholungen aus den letzten
  Versuchen werden gemieden, Antwortoptionen gemischt)
- **Fragenkatalog** mit 163 Aufgaben in `server/src/catalog/` (alle Handlungsschritte, 8 Aufgabentypen):
  - Multiple Choice (Einfach-/Mehrfachauswahl)
  - Zuordnungsaufgaben
  - Lückentexte (Freitext- und Dropdown-Lücken)
  - Rechenaufgaben mit Lösungsweg (**KI-bewertet mit Teilpunkten**)
  - Freitext-/Begründungsaufgaben (**KI-bewertet**)
  - Ausfüllbilder (OSI-Modell, Aktivitätsdiagramm, BPMN, UML, ER, DHCP, Subnetztabelle, …)
  - Netzwerkpläne, die um Geräte, Verbindungen und IP-Adressen ergänzt werden (Drag & Drop)
  - Netzpläne (Vorgangsknoten: FAZ/FEZ/SAZ/SEZ/GP/FP, kritischer Pfad)
- 90-Minuten-Timer mit automatischer Abgabe, Autosave der Antworten
- Auswertung mit IHK-Notenschlüssel, Musterlösungen, KI-Feedback je Kriterium, Selbstbewertung als Fallback

## Voraussetzungen

- Node.js **≥ 22.13** (nutzt das eingebaute `node:sqlite`; getestet mit Node 24)

## Installation und Start

```bash
cd AP1
npm install
cp .env.example .env        # API-Key für die KI-Bewertung eintragen (siehe unten)

# Entwicklung (Backend auf :3001, Frontend mit Hot Reload auf :5173)
npm run dev

# Produktion (Frontend bauen, ein Server auf :3001 liefert alles aus)
npm run build
npm start
```

Danach im Browser `http://localhost:5173` (dev) bzw. `http://localhost:3001` (prod) öffnen, registrieren und
„Neue AP1 starten“.

## KI-Bewertung konfigurieren

Rechen- und Freitextaufgaben werden von einer KI anhand einer Rubrik bewertet (Teilpunkte in 0,5er-Schritten,
Folgefehler werden anerkannt). In `.env`:

| Variable | Bedeutung |
|---|---|
| `AI_PROVIDER` | `auto` (Standard), `claude`, `gemini` oder `none` |
| `ANTHROPIC_API_KEY` | Claude API (https://console.anthropic.com); Modell über `CLAUDE_MODEL`, Standard `claude-opus-5` |
| `GEMINI_API_KEY` | Google AI Studio (https://aistudio.google.com/apikey); Modell über `GEMINI_MODEL`, Standard `gemini-3.8-flash`, Ausweichmodelle über `GEMINI_FALLBACK_MODELS` |

Bei `auto` wird der Anbieter genommen, für den ein Key gesetzt ist (Claude vor Gemini). Ohne Key läuft die App
trotzdem: Rechenaufgaben werden heuristisch anhand der Endergebnisse vorbewertet und alle KI-Aufgaben können in der
Auswertung anhand der Musterlösung selbst bewertet werden.

## Weitere Befehle

```bash
npm run validate   # Fragenkatalog gegen Schema und Prüfungsordnung prüfen
npm test           # Selbsttests der Bewertungslogik (Netzplan, MC, Lückentext, Netzwerkregeln)
```

## Projektstruktur

```
AP1/
├─ shared/            Datenmodell (types.ts) und Netzplan-Algorithmus, von Server und Client genutzt
├─ server/src/
│  ├─ index.ts        Express-Server, liefert in Produktion auch das Frontend aus
│  ├─ auth.ts         Registrierung / Login / Sitzung
│  ├─ db.ts           SQLite (node:sqlite), Datei unter server/data/ap1.sqlite
│  ├─ routes/attempts.ts   Prüfung starten, Antworten speichern, abgeben, Auswertung
│  ├─ exam/blueprint.ts    Prüfungsordnung (Slots je Handlungsschritt)
│  ├─ exam/generator.ts    Zusammenstellung einer konkreten Prüfung
│  ├─ exam/grading.ts      deterministische Bewertung aller Aufgabentypen
│  ├─ ai/grader.ts         KI-Bewertung (Claude / Gemini) + Heuristik
│  └─ catalog/             Fragenkatalog je Handlungsschritt + validate.ts
└─ client/src/
   ├─ pages/          Login, Registrierung, Dashboard, Prüfung, Auswertung, Prüfungsordnung
   └─ components/questions/   eine Komponente je Aufgabentyp (Bearbeitungs- und Auswertungsmodus)
```

## Neue Aufgaben ergänzen

1. Aufgabe in der passenden Datei unter `server/src/catalog/` anlegen (Typen siehe `shared/types.ts`).
   ID-Schema `<hs>-<typ>-<nnn>`, z. B. `nw-ca-007`. Die Punktzahl muss zu einem Slot der Prüfungsordnung passen.
2. `npm run validate` ausführen – prüft Schema, Konsistenz (z. B. Rubrik-Summen, Lücken, Netzplan-Zyklen) und ob
   jeder Slot genügend Kandidaten hat.
