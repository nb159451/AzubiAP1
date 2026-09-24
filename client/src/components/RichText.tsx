import { Fragment, type ReactNode } from 'react';

/**
 * Rendert den einfachen Textdialekt des Fragenkatalogs:
 * - **fett**, `code`
 * - Zeilen, die mit "|" beginnen, werden zu einer Tabelle (erste Zeile = Kopfzeile)
 * - aufeinanderfolgende Zeilen, die komplett in Backticks stehen, werden zu einem Codeblock
 * - Zeilenumbrüche bleiben erhalten
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  const isTableLine = (l: string) => /^\s*\|/.test(l);
  const isCodeLine = (l: string) => /^\s*`[^`]*`\s*$/.test(l);
  const isSeparator = (l: string) => /^\s*\|?[\s|:-]+\|?\s*$/.test(l) && /-/.test(l);

  while (i < lines.length) {
    const line = lines[i];

    if (isTableLine(line)) {
      const rows: string[][] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        if (!isSeparator(lines[i])) {
          const cells = lines[i].trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
          rows.push(cells);
        }
        i++;
      }
      const cols = Math.max(...rows.map((r) => r.length));
      const [head, ...body] = rows;
      blocks.push(
        <table key={key++} className="rich-table">
          <thead>
            <tr>
              {Array.from({ length: cols }, (_, c) => (
                <th key={c}>{inline(head[c] ?? '')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((r, ri) => (
              <tr key={ri}>
                {Array.from({ length: cols }, (_, c) => (
                  <td key={c} className={/^[\d.,\s%€-]+$/.test(r[c] ?? '') && r[c] ? 'num' : undefined}>
                    {inline(r[c] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }

    if (isCodeLine(line) && i + 1 < lines.length && isCodeLine(lines[i + 1])) {
      const code: string[] = [];
      while (i < lines.length && isCodeLine(lines[i])) {
        code.push(lines[i].trim().slice(1, -1));
        i++;
      }
      blocks.push(
        <pre key={key++} className="rich-code">
          {code.join('\n')}
        </pre>,
      );
      continue;
    }

    // Leerzeilen trennen Absätze
    if (!line.trim()) {
      i++;
      continue;
    }
    // Absatz: aufeinanderfolgende normale, nicht leere Zeilen
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isTableLine(lines[i]) &&
      !(isCodeLine(lines[i]) && i + 1 < lines.length && isCodeLine(lines[i + 1]))
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length) {
      blocks.push(
        <p key={key++} className="rich-p">
          {para.map((l, li) => (
            <Fragment key={li}>
              {inline(l)}
              {li < para.length - 1 && <br />}
            </Fragment>
          ))}
        </p>,
      );
    }
  }

  return <div className={`rich ${className ?? ''}`}>{blocks}</div>;
}

function inline(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else out.push(<code key={k++}>{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}
