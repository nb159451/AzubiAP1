import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { DEVICE_LABELS, type DeviceType, type NetworkAnswer, type NetworkDevice, type NetworkDiagramQuestion, type NetworkLink } from '../../../../shared/types';
import type { QProps } from './types';

function DeviceIcon({ type }: { type: DeviceType }) {
  const s = { fill: 'none', stroke: '#2d3a55', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'router':
      return (
        <svg viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" {...s} />
          <path d="M10 13h9l-2-2M22 19h-9l2 2M16 9v3M16 20v3" {...s} />
        </svg>
      );
    case 'switch':
      return (
        <svg viewBox="0 0 32 32">
          <rect x="4" y="10" width="24" height="12" rx="2" {...s} />
          <path d="M9 14v4M13 14v4M17 14v4M21 14v4M25 14v4" {...s} />
        </svg>
      );
    case 'firewall':
      return (
        <svg viewBox="0 0 32 32">
          <rect x="5" y="6" width="22" height="20" rx="2" {...s} />
          <path d="M5 12h22M5 18h22M12 6v6M20 12v6M12 18v8" {...s} />
        </svg>
      );
    case 'server':
    case 'nas':
      return (
        <svg viewBox="0 0 32 32">
          <rect x="7" y="4" width="18" height="8" rx="1.5" {...s} />
          <rect x="7" y="12" width="18" height="8" rx="1.5" {...s} />
          <rect x="7" y="20" width="18" height="8" rx="1.5" {...s} />
          <circle cx="11" cy="8" r="1" fill="#2d3a55" />
          <circle cx="11" cy="16" r="1" fill="#2d3a55" />
          <circle cx="11" cy="24" r="1" fill="#2d3a55" />
        </svg>
      );
    case 'pc':
      return (
        <svg viewBox="0 0 32 32">
          <rect x="4" y="6" width="24" height="15" rx="2" {...s} />
          <path d="M12 26h8M16 21v5" {...s} />
        </svg>
      );
    case 'laptop':
      return (
        <svg viewBox="0 0 32 32">
          <rect x="6" y="7" width="20" height="13" rx="2" {...s} />
          <path d="M3 24h26l-2-4H5z" {...s} />
        </svg>
      );
    case 'printer':
      return (
        <svg viewBox="0 0 32 32">
          <rect x="6" y="12" width="20" height="10" rx="2" {...s} />
          <path d="M10 12V6h12v6M10 22v5h12v-5" {...s} />
        </svg>
      );
    case 'access_point':
      return (
        <svg viewBox="0 0 32 32">
          <circle cx="16" cy="21" r="2" fill="#2d3a55" />
          <path d="M10 15a8 8 0 0 1 12 0M6 11a14 14 0 0 1 20 0" {...s} />
          <path d="M16 23v4" {...s} />
        </svg>
      );
    case 'internet':
    case 'cloud':
      return (
        <svg viewBox="0 0 32 32">
          <path d="M9 24a5 5 0 0 1-.5-10 7 7 0 0 1 13.5-1.5A5 5 0 0 1 24 24z" {...s} />
        </svg>
      );
    case 'modem':
      return (
        <svg viewBox="0 0 32 32">
          <rect x="4" y="12" width="24" height="9" rx="2" {...s} />
          <path d="M8 16.5h.01M12 16.5h.01M22 8l4-4M22 8v-4h4" {...s} />
        </svg>
      );
  }
}

let counter = 0;

export function NetworkDiagram({ question, answer, onChange, readOnly, result }: QProps<NetworkDiagramQuestion, NetworkAnswer>) {
  const a: NetworkAnswer = answer ?? { devices: question.devices.map((d) => ({ ...d })), links: question.links.map((l) => ({ ...l })) };
  const [mode, setMode] = useState<'move' | 'connect'>('move');
  const [source, setSource] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const { width, height } = question.canvas;

  const update = (patch: Partial<NetworkAnswer>) => onChange({ ...a, ...patch });

  function addDevice(type: DeviceType) {
    const id = `new-${type}-${Date.now().toString(36)}-${counter++}`;
    const n = a.devices.filter((d) => !d.fixed).length;
    const dev: NetworkDevice = { id, type, label: DEVICE_LABELS[type], x: 80 + (n % 5) * 100, y: height - 60, fixed: false };
    update({ devices: [...a.devices, dev] });
  }
  function removeDevice(id: string) {
    update({ devices: a.devices.filter((d) => d.id !== id), links: a.links.filter((l) => l.a !== id && l.b !== id) });
  }
  function toggleLink(x: string, y: string) {
    if (x === y) return;
    const exists = a.links.find((l) => (l.a === x && l.b === y) || (l.a === y && l.b === x));
    if (exists) {
      if (!exists.fixed) update({ links: a.links.filter((l) => l !== exists) });
    } else update({ links: [...a.links, { a: x, b: y }] });
  }
  function removeLink(l: NetworkLink) {
    if (l.fixed || readOnly) return;
    update({ links: a.links.filter((x) => x !== l) });
  }

  function onPointerDown(e: RPointerEvent<HTMLDivElement>, d: NetworkDevice) {
    if (readOnly) return;
    if (mode === 'connect') {
      if (!source) setSource(d.id);
      else {
        toggleLink(source, d.id);
        setSource(null);
      }
      return;
    }
    const rect = canvasRef.current!.getBoundingClientRect();
    drag.current = { id: d.id, dx: e.clientX - rect.left - d.x, dy: e.clientY - rect.top - d.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: RPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.max(30, Math.min(width - 30, e.clientX - rect.left - drag.current.dx));
    const y = Math.max(30, Math.min(height - 30, e.clientY - rect.top - drag.current.dy));
    drag.current.moved = true;
    const id = drag.current.id;
    update({ devices: a.devices.map((d) => (d.id === id ? { ...d, x, y } : d)) });
  }
  function onPointerUp() {
    drag.current = null;
  }

  const pos = new Map(a.devices.map((d) => [d.id, d]));

  return (
    <div>
      {!readOnly && (
        <div className="net-toolbar">
          <span className="small muted">Hinzufügen:</span>
          {question.palette.map((t) => (
            <button key={t} type="button" className="btn btn-sm" onClick={() => addDevice(t)}>
              + {DEVICE_LABELS[t]}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <button type="button" className={`btn btn-sm ${mode === 'move' ? 'btn-primary' : ''}`} onClick={() => { setMode('move'); setSource(null); }}>
            Verschieben
          </button>
          <button type="button" className={`btn btn-sm ${mode === 'connect' ? 'btn-primary' : ''}`} onClick={() => setMode('connect')}>
            Verbinden
          </button>
        </div>
      )}
      {!readOnly && (
        <div className="small muted" style={{ marginBottom: '0.5rem' }}>
          {mode === 'connect'
            ? source
              ? 'Klicken Sie nun auf das Zielgerät, um eine Verbindung zu erstellen (nochmal auf eine bestehende Verbindung: entfernen).'
              : 'Modus „Verbinden“: Klicken Sie nacheinander auf zwei Geräte. Klick auf eine gestrichelte Verbindung entfernt sie.'
            : 'Ziehen Sie Geräte mit der Maus. Neue Geräte erscheinen unten und können mit × gelöscht werden. Ausgefüllte Adressfelder werden bewertet.'}
        </div>
      )}
      <div className="net-scroll">
      <div className="net-canvas" ref={canvasRef} style={{ width, height }} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {a.links.map((l, i) => {
            const p = pos.get(l.a);
            const q = pos.get(l.b);
            if (!p || !q) return null;
            return (
              <g key={i}>
                <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} strokeDasharray={l.fixed ? undefined : '7 5'} stroke={l.fixed ? '#2d3a55' : '#1f4fbf'} />
                {!l.fixed && !readOnly && <line className="hit" x1={p.x} y1={p.y} x2={q.x} y2={q.y} onClick={() => removeLink(l)}>
                  <title>Verbindung entfernen</title>
                </line>}
                {l.label && (
                  <text x={(p.x + q.x) / 2} y={(p.y + q.y) / 2 - 6} fontSize={11} textAnchor="middle" fill="#5f6b7c">
                    {l.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {a.devices.map((d) => (
          <div
            key={d.id}
            className={`net-device ${d.fixed ? 'fixed' : 'added'} ${mode === 'connect' && !readOnly ? 'connecting' : ''} ${source === d.id ? 'source' : ''}`}
            style={{ left: d.x, top: d.y }}
            onPointerDown={(e) => onPointerDown(e, d)}
          >
            {!d.fixed && !readOnly && (
              <button type="button" className="net-del" title="Gerät entfernen" onPointerDown={(e) => e.stopPropagation()} onClick={() => removeDevice(d.id)}>
                ×
              </button>
            )}
            <div className="net-icon">
              <DeviceIcon type={d.type} />
            </div>
            <div className="net-label">{d.label}</div>
            {d.ip && <div className="net-ip">{d.ip}</div>}
            {d.ipField && (
              <input
                type="text"
                className="net-ip-input"
                placeholder={d.ipField.placeholder ?? 'IP-Adresse'}
                value={d.ipValue ?? ''}
                disabled={readOnly}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => update({ devices: a.devices.map((x) => (x.id === d.id ? { ...x, ipValue: e.target.value } : x)) })}
              />
            )}
          </div>
        ))}
      </div>
      </div>
      {readOnly && result?.details && (
        <div className="tbl-wrap" style={{ marginTop: '0.6rem' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Anforderung</th>
              <th>Ihre Lösung</th>
              <th>Punkte</th>
            </tr>
          </thead>
          <tbody>
            {result.details.map((d) => (
              <tr key={d.key}>
                <td>{d.label}</td>
                <td className="muted">{d.given}</td>
                <td>
                  <span className={`score-pill ${d.awarded >= d.max ? 'ok' : 'fail'}`}>
                    {d.awarded} / {d.max}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
