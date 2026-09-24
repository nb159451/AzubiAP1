import type { MatchingQuestion } from '../../../../shared/types';
import { RichText } from '../RichText';
import { detailByKey, type QProps } from './types';

export function Matching({ question, answer, onChange, readOnly, result }: QProps<MatchingQuestion, Record<string, string>>) {
  const a = answer ?? {};
  return (
    <div>
      {question.left.map((l) => {
        const d = detailByKey(result, l.id);
        return (
          <div key={l.id} className="match-row">
            <div>
              <RichText text={l.text} />
            </div>
            <div>
              <select value={a[l.id] ?? ''} disabled={readOnly} onChange={(e) => onChange({ ...a, [l.id]: e.target.value })}
                className={readOnly ? (d?.awarded ? 'blank-ok' : 'blank-bad') : ''}
                style={readOnly ? { borderColor: d?.awarded ? 'var(--success)' : 'var(--danger)' } : undefined}>
                <option value="">– bitte wählen –</option>
                {question.right.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.text}
                  </option>
                ))}
              </select>
              {readOnly && d && !d.awarded && <div className="small blank-expected">Richtig: {d.expected}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
