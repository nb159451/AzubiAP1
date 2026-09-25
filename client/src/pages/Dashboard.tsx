import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import type { AttemptSummary } from '../../../shared/types';
import { useAuth } from '../App';

const PROVIDER_LABEL: Record<string, string> = {
  claude: 'Claude API',
  gemini: 'Google AI Studio (Gemini)',
  none: 'keine KI konfiguriert – Rechen-/Freitextaufgaben werden heuristisch bewertet und können selbst nachbewertet werden',
};

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<AttemptSummary[] | null>(null);
  const [provider, setProvider] = useState('none');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .attempts()
      .then((r) => {
        setAttempts(r.attempts);
        setProvider(r.aiProvider);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const running = attempts?.find((a) => a.status === 'running' && new Date(a.deadline).getTime() > Date.now());

  async function start() {
    setBusy(true);
    setError('');
    try {
      const a = await api.startAttempt();
      navigate(`/exam/${a.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && (e.body as { attemptId?: string })?.attemptId) {
        navigate(`/exam/${(e.body as { attemptId: string }).attemptId}`);
        return;
      }
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const graded = attempts?.filter((a) => a.score !== null) ?? [];
  const best = graded.length ? Math.max(...graded.map((a) => (100 * a.score!) / a.totalPoints)) : null;
  const avg = graded.length ? graded.reduce((s, a) => s + (100 * a.score!) / a.totalPoints, 0) / graded.length : null;

  return (
    <div className="page">
      <div className="card">
        <h1>Willkommen, {user?.name}</h1>
        <p className="muted">
          Simulieren Sie die Abschlussprüfung Teil 1 „Einrichten eines IT-gestützten Arbeitsplatzes“: 5 Handlungsschritte, 100 Punkte, 90 Minuten. Jede
          Prüfung wird nach der <Link to="/pruefungsordnung">Prüfungsordnung</Link> neu aus dem Fragenkatalog zusammengestellt.
        </p>
        <div className="info small">
          KI-Bewertung: <strong>{PROVIDER_LABEL[provider] ?? provider}</strong>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="row" style={{ marginTop: '1rem' }}>
          {running ? (
            <Link to={`/exam/${running.id}`} className="btn btn-primary btn-lg">
              Laufende Prüfung fortsetzen
            </Link>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={start} disabled={busy}>
              {busy ? 'Prüfung wird erstellt …' : 'Neue AP1 starten'}
            </button>
          )}
        </div>
      </div>

      {graded.length > 0 && (
        <div className="stats">
          <div className="stat">
            <div className="v">{graded.length}</div>
            <div className="l">abgeschlossene Prüfungen</div>
          </div>
          <div className="stat">
            <div className="v">{best!.toFixed(0)} %</div>
            <div className="l">bestes Ergebnis</div>
          </div>
          <div className="stat">
            <div className="v">{avg!.toFixed(0)} %</div>
            <div className="l">Durchschnitt</div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Ihre Prüfungsversuche</h2>
        {!attempts && <div className="muted">Lade …</div>}
        {attempts && attempts.length === 0 && <div className="muted">Noch keine Prüfung absolviert.</div>}
        {attempts && attempts.length > 0 && (
          <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Status</th>
                <th>Punkte</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => {
                const pct = a.score !== null ? (100 * a.score) / a.totalPoints : null;
                return (
                  <tr key={a.id}>
                    <td>{new Date(a.startedAt).toLocaleString('de-DE')}</td>
                    <td>
                      {a.status === 'running' && <span className="badge badge-warn">läuft</span>}
                      {a.status === 'grading' && <span className="badge badge-warn">wird bewertet</span>}
                      {a.status === 'graded' && <span className={`badge ${pct! >= 50 ? 'badge-success' : 'badge-danger'}`}>{pct! >= 50 ? 'bestanden' : 'nicht bestanden'}</span>}
                    </td>
                    <td>{a.score !== null ? `${a.score} / ${a.totalPoints} (${pct!.toFixed(0)} %)` : '–'}</td>
                    <td>{a.grade ?? '–'}</td>
                    <td>
                      {a.status === 'running' ? (
                        <Link to={`/exam/${a.id}`}>Fortsetzen</Link>
                      ) : (
                        <Link to={`/result/${a.id}`}>Auswertung</Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
