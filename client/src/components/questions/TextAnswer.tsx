import type { CalculationQuestion, FreeTextQuestion } from '../../../../shared/types';
import type { QProps } from './types';

export function TextAnswer({ question, answer, onChange, readOnly }: QProps<CalculationQuestion | FreeTextQuestion, string>) {
  if (readOnly) {
    return <div className="given-answer">{answer?.trim() ? answer : <span className="muted">(keine Antwort)</span>}</div>;
  }
  return (
    <div>
      <textarea
        value={answer ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          question.type === 'calculation'
            ? 'Lösungsweg mit Zwischenschritten, Formeln und Einheiten – das Endergebnis allein reicht nicht für die volle Punktzahl.'
            : 'Ihre Antwort …'
        }
        rows={question.type === 'calculation' ? 10 : 7}
      />
      <div className="small muted">
        {question.type === 'calculation'
          ? 'Diese Aufgabe wird von einer KI anhand einer Bewertungsrubrik korrigiert. Teilpunkte für einen korrekten Ansatz sind möglich.'
          : 'Diese Aufgabe wird von einer KI anhand einer Bewertungsrubrik korrigiert.'}
      </div>
    </div>
  );
}
