export type CardLevel = 'new' | 'again' | 'hard' | 'good' | 'easy';
export type ReviewRating = Exclude<CardLevel, 'new'>;

export interface Card {
  id: string;
  cardFront: string;
  cardBack: string;
  level: CardLevel;
  nextReview: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  title: string;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface DeckSummary {
  id: string;
  title: string;
  totalCards: number;
  dueCards: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export const LEVEL_LABELS: Record<CardLevel, string> = {
  new: 'Nueva',
  again: 'Otra vez',
  hard: 'Difícil',
  good: 'Bien',
  easy: 'Fácil',
};

export const RATING_OPTIONS: { rating: ReviewRating; label: string; interval: string }[] = [
  { rating: 'again', label: 'Otra vez', interval: '5 min' },
  { rating: 'hard', label: 'Difícil', interval: '10 min' },
  { rating: 'good', label: 'Bien', interval: '3 días' },
  { rating: 'easy', label: 'Fácil', interval: '7 días' },
];

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';
const TOKEN_KEY = 'cogni.token';

export const authToken = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const token = authToken.get();
  const headers = new Headers(init?.headers);
  if (!isForm && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      message = [msg, ...(body.errors ?? [])].filter(Boolean).join('\n') || message;
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    if (res.status === 401) {
      authToken.clear();
      window.dispatchEvent(new Event('auth:logout'));
    }
    throw new Error(message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

function upload(path: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return request<Deck>(path, { method: 'POST', body: form });
}

export const api = {
  auth: {
    register: (email: string, password: string, name?: string) =>
      request<AuthResponse>('/auth/register', json('POST', { email, password, name })),
    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/login', json('POST', { email, password })),
    me: () => request<User>('/auth/me'),
  },

  listDecks: () => request<DeckSummary[]>('/decks'),
  getDeck: (id: string) => request<Deck>(`/decks/${id}`),
  createDeck: (title: string) => request<Deck>('/decks', json('POST', { title })),
  updateDeck: (id: string, title: string) => request<Deck>(`/decks/${id}`, json('PATCH', { title })),
  deleteDeck: (id: string) => request<void>(`/decks/${id}`, { method: 'DELETE' }),

  importNewDeck: (file: File, title?: string) =>
    upload(`/decks/import${title ? `?title=${encodeURIComponent(title)}` : ''}`, file),
  importIntoDeck: (id: string, file: File) => upload(`/decks/${id}/import`, file),

  addCard: (deckId: string, cardFront: string, cardBack: string) =>
    request<Card>(`/decks/${deckId}/cards`, json('POST', { cardFront, cardBack })),
  updateCard: (deckId: string, cardId: string, data: Pick<Card, 'cardFront' | 'cardBack'>) =>
    request<Card>(`/decks/${deckId}/cards/${cardId}`, json('PATCH', data)),
  deleteCard: (deckId: string, cardId: string) =>
    request<void>(`/decks/${deckId}/cards/${cardId}`, { method: 'DELETE' }),

  studyCards: (deckId: string) => request<Card[]>(`/decks/${deckId}/study`),
  reviewCard: (deckId: string, cardId: string, rating: ReviewRating) =>
    request<Card>(`/decks/${deckId}/cards/${cardId}/review`, json('POST', { rating })),
};
