import { useEffect, useState } from 'react';
import { api, type BlueprintInfo } from '../api';

export function PruefungsordnungPage() {
  const [info, setInfo] = useState<BlueprintInfo | null>(null);
  useEffect(() => {
    api.blueprint().then(setInfo).catch(() => setInfo(null));
  }, []);
  if (!info) return <div className="page center muted">Lade …</div>;
  const bp = info.blueprint;
  const types = Object.keys(info.typeLabels);

  return (
    <div className="page">
      <div className="card">
        <h1>Prüfungsordnung der digitalen AP1</h1>
        <p className="muted">Version {bp.version}</p>
        <h3>§ 1 Gegenstand</h3>
        <p>
          Die digitale AP1 simuliert Teil 1 der gestreckten Abschlussprüfung „Einrichten eines IT-gestützten Arbeitsplatzes“ für Fachinformatiker/-innen
          Anwendungsentwicklung nach dem Prüfungskatalog der ZPA Nord-West in der 2. Auflage (gültig seit Frühjahr 2025). Die Inhalte gliedern sich in fünf
          Handlungsschritte.
        </p>
        <p>
          Laut{' '}
          <a href="https://www.ihk-zpa.de/export/sites/default/LinkRepository/IHK-Pruefungs-News/IHK-Pruefungs-News_09-24.pdf" target="_blank" rel="noreferrer">
            IHK-Prüfungs-News 9/24 der ZPA Nord-West
          </a>{' '}
          werden SQL und RAID ausschließlich in Teil 2 geprüft, Struktogramm und PAP wurden gestrichen; neu aufgenommen wurden UML/BPMN und KI. Zusätzlich
          entfernt wurden nach Sekundärquellen Vererbung, ISO 2700x, SWOT und LTE/5G; verstärkt wurden Aktivitätsdiagramme, Schreibtischtests, ERP/CRM,
          Hashverfahren, Systemhärtung, DSGVO-Betroffenenrechte sowie Anonymisierung und Pseudonymisierung. Grundlagen relationaler Datenbanken (Modellierung
          ohne SQL) bleiben Teil 1.
        </p>
        <p className="muted small">
          Hinweis zum Format: Die echte AP1 besteht laut ZPA Nord-West aus ausschließlich offenen, handlungsorientierten Aufgaben mit Belegen. Multiple Choice,
          Zuordnung und Lückentext sind hier zusätzliche Trainingsformate; Rechen- und Freitextaufgaben mit KI-Bewertung kommen dem Original am nächsten.
        </p>
        <h3>§ 2 Umfang und Dauer</h3>
        <ul>
          <li>
            Bearbeitungszeit: <strong>{bp.durationMinutes} Minuten</strong>. Nach Ablauf wird die Prüfung automatisch abgegeben (Kulanz: 2 Minuten).
          </li>
          <li>
            Gesamtpunktzahl: <strong>{bp.totalPoints} Punkte</strong>, je Handlungsschritt {bp.sections[0].points} Punkte.
          </li>
          <li>Hilfsmittel: nicht programmierbarer Taschenrechner. Alle Rechenaufgaben verlangen einen nachvollziehbaren Lösungsweg.</li>
        </ul>
        <h3>§ 3 Zusammenstellung der Aufgaben</h3>
        <p>
          Jeder Handlungsschritt besteht aus einer festen Folge von Aufgaben-Slots. Für jeden Slot wird zufällig eine Aufgabe aus dem Katalog gewählt, die Typ
          und Punktzahl des Slots erfüllt. Aufgaben aus den letzten {bp.avoidRepeatsFromLastAttempts} Versuchen desselben Prüflings werden dabei gemieden,
          Antwortoptionen werden gemischt. So ist jede Prüfung anders, folgt aber immer derselben Struktur.
        </p>
        <table className="tbl">
          <thead>
            <tr>
              <th>Handlungsschritt</th>
              <th>Aufgaben-Slots (Typ · Punkte)</th>
              <th>Punkte</th>
            </tr>
          </thead>
          <tbody>
            {bp.sections.map((s, i) => (
              <tr key={s.section}>
                <td>
                  <strong>HS {i + 1}</strong>
                  <br />
                  {info.sectionTitles[s.section]}
                </td>
                <td>
                  <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                    {s.slots.map((sl, j) => (
                      <li key={j}>
                        {sl.label} · <span className="muted">{sl.types.map((t) => info.typeLabels[t]).join(' oder ')}</span> · {sl.points} P
                      </li>
                    ))}
                  </ol>
                </td>
                <td>
                  <strong>{s.points}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>§ 4 Bewertung</h3>
        <ul>
          <li>Multiple Choice (Einfachauswahl): volle Punktzahl nur bei richtiger Antwort.</li>
          <li>Multiple Choice (Mehrfachauswahl): Punkte anteilig; jede falsch gewählte Option neutralisiert eine richtige. Keine Minuspunkte.</li>
          <li>Zuordnungen, Lückentexte, Ausfüllbilder: Punkte anteilig je richtiges Feld. Schreibweise und Groß-/Kleinschreibung werden tolerant verglichen.</li>
          <li>Netzplan: Punkte anteilig je richtigem Zeitwert (FAZ, FEZ, SAZ, SEZ, GP, FP, Gesamtdauer) zuzüglich Punkte für den kritischen Pfad.</li>
          <li>Netzwerkplan: jede Anforderung (Gerät platziert, Verbindung, Adressierung) wird einzeln bewertet.</li>
          <li>
            Rechen- und Freitextaufgaben: Bewertung durch eine KI (Claude API oder Google AI Studio) anhand einer Rubrik mit Teilpunkten in 0,5er-Schritten.
            Folgefehler werden anerkannt; ein Endergebnis ohne Lösungsweg erhält nur die Ergebnispunkte. Ohne konfigurierte KI erfolgt eine heuristische
            Bewertung mit anschließender Selbstbewertung.
          </li>
        </ul>
        <h3>§ 5 Notenschlüssel (IHK)</h3>
        <table className="tbl" style={{ maxWidth: 480 }}>
          <thead>
            <tr>
              <th>Punkte (von 100)</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>92 – 100</td><td>1 (sehr gut)</td></tr>
            <tr><td>81 – 91</td><td>2 (gut)</td></tr>
            <tr><td>67 – 80</td><td>3 (befriedigend)</td></tr>
            <tr><td>50 – 66</td><td>4 (ausreichend)</td></tr>
            <tr><td>30 – 49</td><td>5 (mangelhaft)</td></tr>
            <tr><td>0 – 29</td><td>6 (ungenügend)</td></tr>
          </tbody>
        </table>
        <p className="muted small">Bestanden ist die Prüfung ab 50 Punkten. Die AP1 geht mit 20 % in das Gesamtergebnis der Abschlussprüfung ein.</p>
        <h3>§ 6 Fragenkatalog</h3>
        <p>
          Aktuell {info.catalogSize} Aufgaben im Katalog. KI-Anbieter: <strong>{info.aiProvider}</strong>.
        </p>
        <table className="tbl">
          <thead>
            <tr>
              <th>Handlungsschritt</th>
              {types.map((t) => (
                <th key={t}>{info.typeLabels[t]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bp.sections.map((s, i) => (
              <tr key={s.section}>
                <td>HS {i + 1}</td>
                {types.map((t) => (
                  <td key={t}>{info.stats[s.section]?.[t] ?? '–'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
