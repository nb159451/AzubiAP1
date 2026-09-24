import type { MultipleChoiceQuestion } from '../../../../shared/types';
import { RichText } from '../RichText';
import type { QProps } from './types';

export function MultipleChoice({ question, answer, onChange, readOnly }: QProps<MultipleChoiceQuestion, string[]>) {
  const selected = answer ?? [];
  const correct = new Set(question.correct ?? []);
  function toggle(id: string) {
    if (readOnly) return;
    if (question.multi) onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
    else onChange([id]);
  }
  return (
    <div className="options">
      {question.options.map((o) => {
        const isSel = selected.includes(o.id);
        let cls = 'opt';
        if (readOnly) {
          cls += ' readonly';
          if (correct.has(o.id)) cls += ' correct';
          else if (isSel) cls += ' wrong';
        } else if (isSel) cls += ' selected';
        return (
          <label key={o.id} className={cls}>
            <input type={question.multi ? 'checkbox' : 'radio'} name={question.id} checked={isSel} onChange={() => toggle(o.id)} disabled={readOnly} />
            <span style={{ flex: 1 }}>
              <RichText text={o.text} />
            </span>
            {readOnly && correct.has(o.id) && <span className="badge badge-success">richtig</span>}
            {readOnly && !correct.has(o.id) && isSel && <span className="badge badge-danger">falsch gewählt</span>}
          </label>
        );
      })}
    </div>
  );
}
