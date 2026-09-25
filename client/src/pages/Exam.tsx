import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Answer, AttemptView } from '../../../shared/types';
import { QuestionView } from '../components/QuestionView';

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function hasAnswer(a: Answer | undefined): boolean {
  if (a === undefined || a === null) return false;
  if (typeof a === 'string') return a.trim().length > 0;
  if (Array.isArray(a)) return a.length > 0;
  if (typeof a === 'object') {
    if ('nodes' in a) return Object.keys((a as { nodes: object }).nodes).length > 0;
    if ('devices' in a) return true;
    return Object.values(a as Record<string, string>).some((v) => v && String(v).trim());
  }
  return false;
}

export function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [pos, setPos] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const dirty = useRef<Record<string, Answer>>({});
  const timer = useRef<number | null>(null);

  useEffect(() => {
    api
      .attempt(id!)
      .then((a) => {
        if (a.status !== 'running') {
          navigate(`/result/${a.id}`, { replace: true });
          return;
        }
        setAttempt(a);
        setAnswers(a.answers);
      })
      .catch((e) => setError((e as Error).message));
  }, [id, navigate]);

  const flat = useMemo(() => {
    if (!attempt) return [];
    return attempt.exam.sections.flatMap((s, si) => s.questions.map((q, qi) => ({ q, si, qi, label: `${si + 1}.${qi + 1}`, sectionTitle: s.title })));
  }, [attempt]);

  const flush = useCallback(async () => {
    const payload = dirty.current;
    if (!Object.keys(payload).length || !attempt) return;
    dirty.current = {};
    setSaveState('saving');
    try {
      await api.saveAnswers(attempt.id, payload);
      setSaveState(Object.keys(dirty.current).length ? 'dirty' : 'saved');
    } catch {
      dirty.current = { ...payload, ...dirty.current };
      setSaveState('error');
    }
  }, [attempt]);

  function onChange(qid: string, a: Answer) {
    setAnswers((prev) => ({ ...prev, [qid]: a }));
    dirty.current[qid] = a;
    setSaveState('dirty');
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), 1200);
  }

  const submit = useCallback(
    async (auto = false) => {
      if (!attempt || submitting) return;
      if (!auto) {
        const open = flat.filter((f) => !hasAnswer(answers[f.q.id])).length;
        const msg = open > 0 ? `Es sind noch ${open} Aufgabe(n) unbeantwortet. Prüfung trotzdem abgeben?` : 'Prüfung jetzt abgeben? Danach sind keine Änderungen mehr möglich.';
        if (!window.confirm(msg)) return;
      }
      setSubmitting(true);
      try {
        await flush();
        await api.submit(attempt.id);
        navigate(`/result/${attempt.id}`, { replace: true });
      } catch (e) {
        setError((e as Error).message);
        setSubmitting(false);
      }
    },
    [attempt, submitting, flat, answers, flush, navigate],
  );

  // Uhr + automatische Abgabe
  useEffect(() => {
    const iv = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(iv);
  }, []);
  const remaining = attempt ? new Date(attempt.deadline).getTime() - now : 0;
  useEffect(() => {
    if (attempt && remaining <= 0 && !submitting) void submit(true);
  }, [attempt, remaining, submitting, submit]);

  // Beim Verlassen speichern
  useEffect(() => {
    const h = () => {
      if (Object.keys(dirty.current).length && attempt) {
        navigator.sendBeacon?.(
          `/api/attempts/${attempt.id}/answers`,
          new Blob([JSON.stringify({ answers: dirty.current })], { type: 'application/json' }),
        );
      }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [attempt]);

  if (error) return <div className="page"><div className="error">{error}</div></div>;
  if (!attempt) return <div className="page center muted">Prüfung wird geladen …</div>;

  const cur = flat[pos];
  const answered = flat.filter((f) => hasAnswer(answers[f.q.id])).length;

  return (
    <div className="exam-layout">
      <aside className="exam-rail">
        <div className="rail-status">
          <div className="small muted rail-label">Verbleibende Zeit</div>
          <div className={`timer ${remaining < 5 * 60 * 1000 ? 'warn' : ''}`}>{fmt(remaining)}</div>
          <div className="progress">
            <div style={{ width: `${(100 * answered) / flat.length}%` }} />
          </div>
          <div className="small muted">
            {answered} von {flat.length} beantwortet
          </div>
        </div>
        <nav className="rail-nav" aria-label="Aufgaben">
          {attempt.exam.sections.map((s, si) => (
            <div key={s.section} className="nav-section">
              <div className="t">
                HS {si + 1}<span className="t-title">: {s.title}</span>
              </div>
              <div className="nav-q">
                {s.questions.map((q, qi) => {
                  const idx = flat.findIndex((f) => f.q.id === q.id);
                  return (
                    <button
                      key={q.id}
                      className={`${hasAnswer(answers[q.id]) ? 'answered' : ''} ${idx === pos ? 'active' : ''}`}
                      onClick={() => setPos(idx)}
                      title={q.title}
                      aria-current={idx === pos ? 'true' : undefined}
                    >
                      {si + 1}.{qi + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="rail-submit">
          <button className="btn btn-danger" disabled={submitting} onClick={() => void submit(false)}>
            {submitting ? 'Wird abgegeben …' : 'Prüfung abgeben'}
          </button>
          <div className="savestate">
            {saveState === 'saving' && 'Speichere …'}
            {saveState === 'saved' && 'Alle Antworten gespeichert'}
            {saveState === 'dirty' && 'Ungespeicherte Änderungen'}
            {saveState === 'error' && <span style={{ color: 'var(--danger)' }}>Speichern fehlgeschlagen – wird erneut versucht</span>}
            {saveState === 'idle' && 'Antworten werden automatisch gespeichert'}
          </div>
        </div>
      </aside>
      <section className="exam-content">
        <div className="small muted" style={{ marginBottom: '0.4rem' }}>
          Handlungsschritt {cur.si + 1}: {cur.sectionTitle}
        </div>
        <QuestionView key={cur.q.id} index={cur.label} question={cur.q} answer={answers[cur.q.id]} onChange={(a) => onChange(cur.q.id, a)} readOnly={false} />
        <div className="exam-footer">
          <button className="btn" disabled={pos === 0} onClick={() => setPos(pos - 1)}>
            ← Zurück
          </button>
          <span className="muted small">
            Aufgabe {pos + 1} von {flat.length}
          </span>
          {pos < flat.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setPos(pos + 1)}>
              Weiter →
            </button>
          ) : (
            <button className="btn btn-danger" disabled={submitting} onClick={() => void submit(false)}>
              Prüfung abgeben
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
