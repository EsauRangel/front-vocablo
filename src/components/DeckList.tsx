import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, DeckSummary } from '../api/client';
import { JsonUpload } from './JsonUpload';

interface Props {
  onOpen: (deckId: string) => void;
  onStudy: (deckId: string) => void;
}

export function DeckList({ onOpen, onStudy }: Props) {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setDecks(await api.listDecks());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const deck = await api.createDeck(title.trim());
      setTitle('');
      onOpen(deck.id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (deck: DeckSummary) => {
    if (!confirm(`¿Eliminar el mazo "${deck.title}" y sus ${deck.totalCards} cards?`)) return;
    try {
      await api.deleteDeck(deck.id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section>
      <div className="panel">
        <h2>Nuevo mazo</h2>
        <form className="inline-form" onSubmit={handleCreate}>
          <input placeholder="Título del mazo" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="btn primary" disabled={!title.trim()}>
            Crear
          </button>
        </form>
        <div className="divider">o</div>
        <JsonUpload
          label="Cargar archivo JSON como mazo nuevo"
          onUpload={async (file) => {
            await api.importNewDeck(file);
            await load();
          }}
        />
        <p className="hint">
          Formato: <code>[{'{'}"cardFront": "...", "cardBack": "..."{'}'}]</code> o{' '}
          <code>{'{'}"title": "...", "cards": [...]{'}'}</code>
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      <h2>Mis mazos</h2>
      {loading ? (
        <p className="muted">Cargando…</p>
      ) : decks.length === 0 ? (
        <p className="muted">Aún no tienes mazos.</p>
      ) : (
        <ul className="deck-list">
          {decks.map((deck) => (
            <li key={deck.id} className="deck-item">
              <button className="deck-title" onClick={() => onOpen(deck.id)}>
                {deck.title}
              </button>
              <span className="muted">
                {deck.totalCards} cards · <strong className="due">{deck.dueCards}</strong> por estudiar
              </span>
              <div className="actions">
                <button className="btn primary" disabled={deck.dueCards === 0} onClick={() => onStudy(deck.id)}>
                  Estudiar
                </button>
                <button className="btn danger" onClick={() => handleDelete(deck)}>
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
