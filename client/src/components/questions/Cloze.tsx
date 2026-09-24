import { Fragment } from 'react';
import type { ClozeQuestion } from '../../../../shared/types';
import { detailByKey, type QProps } from './types';

export function Cloze({ question, answer, onChange, readOnly, result }: QProps<ClozeQuestion, Record<string, string>>) {
  const a = answer ?? {};
  const parts = question.template.split(/(\{\{\w+\}\})/g);
  const blanks = new Map(question.blanks.map((b) => [b.id, b]));
  return (
    <div className="cloze">
      {parts.map((p, i) => {
        const m = p.match(/^\{\{(\w+)\}\}$/);
        if (!m) return <Fragment key={i}>{p}</Fragment>;
        const b = blanks.get(m[1]);
        if (!b) return <Fragment key={i}>{p}</Fragment>;
        const d = detailByKey(result, b.id);
        const cls = readOnly ? (d?.awarded ? 'blank-ok' : 'blank-bad') : '';
        const field = b.options ? (
          <select value={a[b.id] ?? ''} disabled={readOnly} className={cls} onChange={(e) => onChange({ ...a, [b.id]: e.target.value })}>
            <option value="">…</option>
            {b.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={a[b.id] ?? ''}
            disabled={readOnly}
            className={cls}
            placeholder={`Lücke ${question.blanks.findIndex((x) => x.id === b.id) + 1}`}
            style={{ width: `${Math.max(120, Math.min(320, ((a[b.id]?.length ?? 8) + 4) * 9))}px` }}
            onChange={(e) => onChange({ ...a, [b.id]: e.target.value })}
          />
        );
        return (
          <Fragment key={i}>
            {field}
            {readOnly && d && !d.awarded && <span className="blank-expected">[{d.expected}]</span>}
          </Fragment>
        );
      })}
    </div>
  );
}
