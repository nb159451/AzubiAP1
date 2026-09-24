import type { DiagramElement, ImageFillQuestion } from '../../../../shared/types';
import { detailByKey, type QProps } from './types';

export function Diagram({ width, height, elements }: { width: number; height: number; elements: DiagramElement[] }) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#2d3a55" />
        </marker>
      </defs>
      {elements.map((el, i) => {
        switch (el.kind) {
          case 'rect':
            return (
              <rect key={i} x={el.x} y={el.y} width={el.w} height={el.h} rx={el.rx ?? 3} fill={el.fill ?? '#ffffff'} stroke={el.stroke ?? '#2d3a55'} strokeWidth={1.5} strokeDasharray={el.dashed ? '6 4' : undefined} />
            );
          case 'ellipse':
            return <ellipse key={i} cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry} fill={el.fill ?? '#ffffff'} stroke={el.stroke ?? '#2d3a55'} strokeWidth={1.5} />;
          case 'text':
            return (
              <text key={i} x={el.x} y={el.y} fontSize={el.size ?? 13} fontWeight={el.bold ? 700 : 400} textAnchor={el.anchor ?? 'start'} fill={el.color ?? '#1a2233'} fontFamily={el.mono ? 'ui-monospace, Menlo, Consolas, monospace' : 'system-ui, sans-serif'} dominantBaseline="middle">
                {el.text}
              </text>
            );
          case 'line':
            return (
              <line key={i} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={el.stroke ?? '#2d3a55'} strokeWidth={1.5} strokeDasharray={el.dashed ? '6 4' : undefined} markerEnd={el.arrow ? 'url(#arrow)' : undefined} markerStart={el.arrowStart ? 'url(#arrow)' : undefined} />
            );
          case 'path':
            return <path key={i} d={el.d} fill={el.fill ?? 'none'} stroke={el.stroke ?? '#2d3a55'} strokeWidth={1.5} strokeDasharray={el.dashed ? '6 4' : undefined} />;
        }
      })}
    </svg>
  );
}

export function ImageFill({ question, answer, onChange, readOnly, result }: QProps<ImageFillQuestion, Record<string, string>>) {
  const a = answer ?? {};
  const { width, height, elements } = question.diagram;
  return (
    <div>
      <div className="diagram-wrap">
        <Diagram width={width} height={height} elements={elements} />
        {question.blanks.map((b, idx) => {
          const d = detailByKey(result, b.id);
          const cls = `diagram-blank ${readOnly ? (d?.awarded ? 'ok' : 'bad') : ''}`;
          const style = { left: b.x, top: b.y, width: b.w, height: b.h } as const;
          if (b.options) {
            return (
              <select key={b.id} className={cls} style={style} value={a[b.id] ?? ''} disabled={readOnly} onChange={(e) => onChange({ ...a, [b.id]: e.target.value })} title={`Feld ${idx + 1}`}>
                <option value="">{b.hint ?? '…'}</option>
                {b.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            );
          }
          return (
            <input key={b.id} type="text" className={cls} style={style} value={a[b.id] ?? ''} disabled={readOnly} placeholder={b.hint ?? `${idx + 1}`} onChange={(e) => onChange({ ...a, [b.id]: e.target.value })} title={`Feld ${idx + 1}`} />
          );
        })}
      </div>
      {readOnly && result?.details && result.details.some((d) => !d.awarded) && (
        <div className="small" style={{ marginTop: '0.5rem' }}>
          <strong>Richtige Lösungen:</strong>{' '}
          {result.details.filter((d) => !d.awarded).map((d) => (
            <span key={d.key} className="badge badge-success" style={{ marginRight: 4 }}>
              {d.label}: {d.expected}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
