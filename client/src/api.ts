import type { Answer, AttemptSummary, AttemptView } from '../../shared/types';

export interface User {
  id: number;
  email: string;
  name: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? `Fehler ${res.status}`, data);
  return data as T;
}

export const api = {
  me: () => request<{ user: User }>('GET', '/api/auth/me'),
  login: (email: string, password: string) => request<{ user: User }>('POST', '/api/auth/login', { email, password }),
  register: (email: string, name: string, password: string) =>
    request<{ user: User }>('POST', '/api/auth/register', { email, name, password }),
  logout: () => request<{ ok: true }>('POST', '/api/auth/logout'),

  blueprint: () => request<BlueprintInfo>('GET', '/api/blueprint'),

  attempts: () => request<{ attempts: AttemptSummary[]; aiProvider: string }>('GET', '/api/attempts'),
  startAttempt: () => request<AttemptView>('POST', '/api/attempts'),
  attempt: (id: string) => request<AttemptView>('GET', `/api/attempts/${id}`),
  saveAnswers: (id: string, answers: Record<string, Answer>) =>
    request<{ ok: true; savedAt: string }>('PUT', `/api/attempts/${id}/answers`, { answers }),
  submit: (id: string) => request<AttemptView>('POST', `/api/attempts/${id}/submit`),
  selfGrade: (id: string, questionId: string, points: number) =>
    request<AttemptView>('POST', `/api/attempts/${id}/self-grade`, { questionId, points }),
  regrade: (id: string, questionId: string) => request<AttemptView>('POST', `/api/attempts/${id}/regrade`, { questionId }),
};

export interface BlueprintInfo {
  blueprint: {
    version: string;
    durationMinutes: number;
    totalPoints: number;
    avoidRepeatsFromLastAttempts: number;
    sections: {
      section: string;
      points: number;
      slots: { label: string; types: string[]; points: number; topics?: string[]; minCandidates: number }[];
    }[];
  };
  sectionTitles: Record<string, string>;
  typeLabels: Record<string, string>;
  catalogSize: number;
  stats: Record<string, Record<string, number>>;
  aiProvider: string;
}
