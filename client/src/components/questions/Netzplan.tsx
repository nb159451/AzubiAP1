import { useMemo } from 'react';
import type { NetzplanAnswer, NetzplanNodeAnswer, NetzplanQuestion } from '../../../../shared/types';
import { computeNetzplan } from '../../../../shared/netzplan';
import { detailByKey, type QProps } from './types';

const NODE_W = 168;
const NODE_H = 112;
const COL = 240;
const ROW = 150;

type Field = 'FAZ' | 'FEZ' | 'SAZ' | 'SEZ' | 'GP' | 'FP';

export function Netzplan({ question, answer, onChange, readOnly, result }: QProps<NetzplanQuestion, NetzplanAnswer>) {
  const a: NetzplanAnswer = answer ?? { nodes: {} };
  const layout = useMemo(() => {
    // Nur die topologischen Ebenen werden für die Darstellung genutzt.
    const { levels } = computeNetzplan(question.activities);
    const pos = new Map<string, { x: number; y: number }>();
    const maxRows = Math.max(...levels.map((l) => l.length));
    levels.forEach((ids, col) => {
      const offset = ((maxRows - ids.length) * ROW) / 2;
      ids.forEach((id, row) => pos.set(id, { x: 30 + col * COL, y: 20 + offset + row * ROW }));
    });
    return { pos, width: 30 + levels.length * COL, height: 40 + maxRows * ROW };
  }, [question.activities]);

  function setField(id: string, f: keyof NetzplanNodeAnswer, v: number | '' | boolean) {
    onChange({ ...a, nodes: { ...a.nodes, [id]: { ...(a.nodes[id] ?? {}), [f]: v } } });
  }

  const cell = (id: string, f: Field) => {
    const d = detailByKey(result, `${id}.${f}`);
    const v = a.nodes[id]?.[f];
    return (
      <div className="np-cell" key={f}>
        <span className="lbl">{f}</span>
        <input
          type="number"
          value={v === undefined ? '' : v}
          disabled={readOnly}
          className={readOnly ? (d?.awarded ? 'ok' : 'bad') : ''}
          onChange={(e) => setField(id, f, e.target.value === '' ? '' : Number(e.target.value))}
          title={readOnly && d ? `Richtig: ${d.expected}` : f}
        />
        {readOnly && d && !d.awarded && <span className="small blank-expected">{d.expected}</span>}
      </div>
    );
  };

  const critDetail = detailByKey(result, 'critical');
  const durDetail = detailByKey(result, 'duration');

  return (
    <div>
      <div className="np-legend">
        Tragen Sie für jeden Vorgang FAZ, FEZ, SAZ, SEZ, GP und FP ein und markieren Sie die Vorgänge des kritischen Pfads. Zeiteinheit: {question.unit}.
      </div>
      <div className="netzplan-scroll">
        <div style={{ position: 'relative', width: layout.width, height: layout.height }}>
          <svg width={layout.width} height={layout.height} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <marker id="np-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2d3a55" />
              </marker>
            </defs>
            {question.activities.flatMap((act) =>
              act.predecessors.map((p) => {
                const from = layout.pos.get(p)!;
                const to = layout.pos.get(act.id)!;
                const x1 = from.x + NODE_W;
                const y1 = from.y + NODE_H / 2;
                const x2 = to.x;
                const y2 = to.y + NODE_H / 2;
                const mx = (x1 + x2) / 2;
                return <path key={`${p}-${act.id}`} d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke="#2d3a55" strokeWidth={1.5} markerEnd="url(#np-arrow)" />;
              }),
            )}
          </svg>
          {question.activities.map((act) => {
            const p = layout.pos.get(act.id)!;
            const crit = !!a.nodes[act.id]?.critical;
            return (
              <div key={act.id} className={`np-node ${crit ? 'critical' : ''}`} style={{ left: p.x, top: p.y }}>
                <div className="np-row r3">
                  {cell(act.id, 'FAZ')}
                  <div className="np-cell">
                    <span className="lbl">Dauer</span>
                    <strong>{act.duration}</strong>
                  </div>
                  {cell(act.id, 'FEZ')}
                </div>
                <div className="np-name" title={act.name}>
                  {act.id}: {act.name}
                </div>
                <div className="np-row r4">
                  {cell(act.id, 'SAZ')}
                  {cell(act.id, 'GP')}
                  {cell(act.id, 'FP')}
                  {cell(act.id, 'SEZ')}
                </div>
                <label className="np-crit">
                  <input type="checkbox" checked={crit} disabled={readOnly} onChange={(e) => setField(act.id, 'critical', e.target.checked)} />
                  kritisch
                </label>
              </div>
            );
          })}
        </div>
      </div>
      <div className="row" style={{ marginTop: '0.6rem' }}>
        <label>
          <strong>Gesamtdauer des Projekts ({question.unit}):</strong>{' '}
          <input type="number" style={{ width: 100 }} value={a.duration ?? ''} disabled={readOnly} className={readOnly ? (durDetail?.awarded ? 'blank-ok' : 'blank-bad') : ''} onChange={(e) => onChange({ ...a, duration: e.target.value === '' ? '' : Number(e.target.value) })} />
          {readOnly && durDetail && !durDetail.awarded && <span className="blank-expected">[{durDetail.expected}]</span>}
        </label>
        {readOnly && critDetail && (
          <span className="small">
            Kritischer Pfad (Lösung): <strong>{critDetail.expected}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
