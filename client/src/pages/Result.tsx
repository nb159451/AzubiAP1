import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { ihkGrade, type AttemptView } from '../../../shared/types';
import { QuestionView, scoreClass } from '../components/QuestionView';

export function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let stop = false;
    let t: number | undefined;
    const load = async () => {
      try {
        const a = await api.attempt(id!);
        if (stop) return;
        setAttempt(a);
        if (a.status === 'grading' || a.status === 'running') t = window.setTimeout(load, 2000);
      } catch (e) {
        setError((e as Error).message);
      }
    };
    void load();
    return () => {
      stop = true;
      if (t) window.clearTimeout(t);
    };
  }, [id]);

  if (error) return <div className="page"><div className="error">{error}</div></div>;
  if (!attempt) return <div className="page center muted">Lade …</div>;
  if (attempt.status !== 'graded') {
    return (
      <div className="page center">
        <div className="card">
          <span className="spinner" /> <strong>Ihre Prüfung wird ausgewertet …</strong>
          <p className="muted">Rechen- und Freitextaufgaben werden von der KI bewertet. Je nach Auslastung des KI-Anbieters kann das einige Minuten dauern.</p>
        </div>
      </div>
    );
  }

  const results = attempt.results ?? {};
  const score = attempt.score ?? 0;
  const total = attempt.exam.totalPoints;
  const percent = (100 * score) / total;
  const g = ihkGrade(percent);
  const manual = Object.values(results).filter((r) => r.needsManualReview).length;

  const sectionRows = attempt.exam.sections.map((s) => {
    const max = s.questions.reduce((x, q) => x + q.points, 0);
    const got = s.questions.reduce((x, q) => x + (results[q.id]?.points ?? 0), 0);
    return { title: s.title, max, got };
  });

  async function selfGrade(qid: string, points: number) {
    const a = await api.selfGrade(attempt!.id, qid, points);
    setAttempt(a);
  }
  async function regrade(qid: string) {
    const a = await api.regrade(attempt!.id, qid);
    setAttempt(a);
  }

  let n = 0;
  return (
    <div className="page">
      <div className="card">
        <div className="row spread">
          <div>
            <h1>Auswertung</h1>
            <div className="muted small">
              Gestartet {new Date(attempt.startedAt).toLocaleString('de-DE')} · abgegeben {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('de-DE') : '–'}
            </div>
          </div>
          <Link to="/" className="btn">
            Zur Übersicht
          </Link>
        </div>
        <div className="stats">
          <div className="stat">
            <div className="v">
              {score} / {total}
            </div>
            <div className="l">Punkte</div>
          </div>
          <div className="stat">
            <div className="v">{percent.toFixed(1)} %</div>
            <div className="l">Ergebnis</div>
          </div>
          <div className="stat">
            <div className="v">Note {g.grade}</div>
            <div className="l">{g.label}</div>
          </div>
          <div className="stat">
            <div className="v" style={{ color: g.passed ? 'var(--success)' : 'var(--danger)' }}>
              {g.passed ? 'bestanden' : 'nicht bestanden'}
            </div>
            <div className="l">ab 50 % bestanden</div>
          </div>
        </div>
        {manual > 0 && (
          <div className="notice">
            {manual} Aufgabe(n) konnten nicht automatisch bewertet werden (keine KI konfiguriert). Sie können sich diese Aufgaben unten anhand der Musterlösung selbst bewerten.
          </div>
        )}
        <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Handlungsschritt</th>
              <th style={{ width: 200 }}>Ergebnis</th>
              <th style={{ width: 110 }}>Punkte</th>
            </tr>
          </thead>
          <tbody>
            {sectionRows.map((r, i) => (
              <tr key={i}>
                <td>
                  HS {i + 1}: {r.title}
                </td>
                <td>
                  <div className="progress">
                    <div style={{ width: `${(100 * r.got) / r.max}%`, background: r.got / r.max >= 0.5 ? 'var(--success)' : 'var(--danger)' }} />
                  </div>
                </td>
                <td>
                  <span className={`score-pill ${scoreClass(r.got, r.max)}`}>
                    {r.got} / {r.max}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {attempt.exam.sections.map((s, si) => (
        <div key={s.section}>
          <h2 style={{ margin: '1.5rem 0 0.6rem' }}>
            Handlungsschritt {si + 1}: {s.title}
          </h2>
          {s.questions.map((q, qi) => {
            n++;
            return (
              <QuestionView
                key={q.id}
                index={`${si + 1}.${qi + 1}`}
                question={q}
                answer={attempt.answers[q.id]}
                onChange={() => {}}
                readOnly
                result={results[q.id]}
                onSelfGrade={results[q.id]?.needsManualReview ? (p) => selfGrade(q.id, p) : undefined}
                onRegrade={results[q.id]?.needsManualReview && results[q.id]?.aiError ? () => regrade(q.id) : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
