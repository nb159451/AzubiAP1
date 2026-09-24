import type { GradeResult, Question } from '../../../../shared/types';

export interface QProps<Q extends Question, A> {
  question: Q;
  answer: A | undefined;
  onChange: (a: A) => void;
  readOnly: boolean;
  /** Nur im Auswertungsmodus gesetzt */
  result?: GradeResult;
}

export function detailByKey(result: GradeResult | undefined, key: string) {
  return result?.details?.find((d) => d.key === key);
}
