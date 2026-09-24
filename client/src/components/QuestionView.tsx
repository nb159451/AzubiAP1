import { useState } from 'react';
import { QUESTION_TYPE_LABELS, type Answer, type GradeResult, type NetworkAnswer, type NetzplanAnswer, type Question } from '../../../shared/types';
import { RichText } from './RichText';
import { MultipleChoice } from './questions/MultipleChoice';
import { Matching } from './questions/Matching';
import { Cloze } from './questions/Cloze';
import { TextAnswer } from './questions/TextAnswer';
import { ImageFill } from './questions/ImageFill';
import { NetworkDiagram } from './questions/NetworkDiagram';
import { Netzplan } from './questions/Netzplan';

interface Props {
  index: string;
  question: Question;
  answer: Answer | undefined;
  onChange: (a: Answer) => void;
  readOnly: boolean;
  result?: GradeResult;
  onSelfGrade?: (points: number) => Promise<void>;
  onRegrade?: () => Promise<void>;
}

export function scoreClass(points: number, max: number) {
  if (points >= max) return 'ok';
  if (points > 0) return 'partial';
  return 'fail';
}

export function QuestionView({ index, question: q, answer, onChange, readOnly, result, onSelfGrade, onRegrade }: Props) {
  const [self, setSelf] = useState<number>(result?.points ?? 0);
  const [busy, setBusy] = useState(false);
  const [regradeError, setRegradeError] = useState('');

  const body = (() => {
    switch (q.type) {
      case 'multiple_choice':
        return <MultipleChoice question={q} answer={answer as string[] | undefined} onChange={onChange} readOnly={readOnly} result={result} />;
      case 'matching':
        return <Matching question={q} answer={answer as Record<string, string> | undefined} onChange={onChange} readOnly={readOnly} result={result} />;
      case 'cloze':
        return <Cloze question={q} answer={answer as Record<string, string> | undefined} onChange={onChange} readOnly={readOnly} result={result} />;
      case 'calculation':
      case 'free_text':
        return <TextAnswer question={q} answer={answer as string | undefined} onChange={onChange} readOnly={readOnly} result={result} />;
      case 'image_fill':
        return <ImageFill question={q} answer={answer as Record<string, string> | undefined} onChange={onChange} readOnly={readOnly} result={result} />;
      case 'network_diagram':
        return <NetworkDiagram question={q} answer={answer as NetworkAnswer | undefined} onChange={onChange} readOnly={readOnly} result={result} />;
      case 'netzplan':
        return <Netzplan question={q} answer={answer as NetzplanAnswer | undefined} onChange={onChange} readOnly={readOnly} result={result} />;
    }
  })();

  return (
    <div className="card">
      <div className="q-head">
        <div>
          <h2>
            {index} {q.title}
          </h2>
          <div className="meta">
            <span className="badge badge-primary">{QUESTION_TYPE_LABELS[q.type]}</span>
            <span className="badge">{q.points} {q.points === 1 ? 'Punkt' : 'Punkte'}</span>
            <span className="badge">{'●'.repeat(q.difficulty)}{'○'.repeat(3 - q.difficulty)}</span>
            {(q.type === 'calculation' || q.type === 'free_text') && <span className="badge badge-warn">KI-Bewertung</span>}
          </div>
        </div>
        {result && (
          <span className={`score-pill ${scoreClass(result.points, result.maxPoints)}`}>
            {result.points} / {result.maxPoints} P
          </span>
        )}
      </div>
      {q.scenario && (
        <div className="scenario">
          <RichText text={q.scenario} />
        </div>
      )}
      <div className="qtext">
        <RichText text={q.text} />
      </div>
      {body}

      {result && (
        <div>
          {result.feedback && (
            <div className="feedback">
              <strong>{result.aiGraded ? 'Bewertung der KI' : 'Auswertung'}:</strong> {result.feedback}
              {result.grader && result.aiGraded && <div className="small muted">Bewertet durch {result.grader}</div>}
            </div>
          )}
          {result.details && (q.type === 'calculation' || q.type === 'free_text') && result.details.length > 0 && (
            <table className="tbl" style={{ marginTop: '0.6rem' }}>
              <thead>
                <tr>
                  <th>Kriterium</th>
                  <th>Kommentar</th>
                  <th>Punkte</th>
                </tr>
              </thead>
              <tbody>
                {result.details.map((d) => (
                  <tr key={d.key}>
                    <td>{d.label}</td>
                    <td className="muted">{d.comment}</td>
                    <td>
                      <span className={`score-pill ${scoreClass(d.awarded, d.max)}`}>
                        {d.awarded} / {d.max}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {result.needsManualReview && onSelfGrade && (
            <div className="notice">
              <strong>Selbstbewertung:</strong>{' '}
              {result.aiError
                ? 'Die KI-Bewertung ist fehlgeschlagen (z. B. Modell überlastet). Sie können sie erneut anstoßen oder sich anhand der Musterlösung selbst Punkte geben.'
                : 'Für diese Aufgabe ist keine KI-Bewertung konfiguriert. Vergleichen Sie Ihre Antwort mit der Musterlösung und vergeben Sie sich Punkte.'}
              {result.aiError && <div className="small muted" style={{ marginTop: 4 }}>Fehler: {result.aiError}</div>}
              {onRegrade && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    className="btn btn-sm"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setRegradeError('');
                      try {
                        await onRegrade();
                      } catch (e) {
                        setRegradeError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {busy ? <><span className="spinner" /> KI bewertet …</> : 'Erneut per KI bewerten'}
                  </button>
                  {regradeError && <span className="small" style={{ color: 'var(--danger)', marginLeft: 8 }}>{regradeError}</span>}
                </div>
              )}
              <div className="row" style={{ marginTop: '0.5rem' }}>
                <input type="number" min={0} max={q.points} step={0.5} value={self} onChange={(e) => setSelf(Number(e.target.value))} style={{ width: 90 }} />
                <span>von {q.points} Punkten</span>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onSelfGrade(self);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Übernehmen
                </button>
              </div>
            </div>
          )}
          {'solution' in q && q.solution && (
            <div className="solution">
              <strong>Musterlösung:</strong>
              <RichText text={q.solution} />
            </div>
          )}
          {q.explanation && (
            <div className="info">
              <strong>Erläuterung:</strong> <RichText text={q.explanation} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
