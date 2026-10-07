import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, Card, Deck, LEVEL_LABELS } from '../api/client';
import { CardForm } from './CardForm';
import { JsonUpload } from './JsonUpload';

interface Props {
  deckId: string;
  onBack: () => void;
  onStudy: () => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

export function DeckDetail({ deckId, onBack, onStudy }: Props) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDeck(await api.getDeck(deckId));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [deckId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!deck) return error ? <p className="error">{error}</p> : <p className="muted">Cargando…</p>;

  const now = Date.now();
  const dueCount = deck.cards.filter((c) => new Date(c.nextReview).getTime() <= now).length;

  const saveTitle = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setDeck(await api.updateDeck(deck.id, title.trim()));
      setEditingTitle(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteCard = async (card: Card) => {
    if (!confirm(`¿Eliminar la card "${card.cardFront}"?`)) return;
    try {
      await api.deleteCard(deck.id, card.id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section>
      <button className="link" onClick={onBack}>
        ← Mazos
      </button>

      <div className="deck-header">
        {editingTitle ? (
          <form className="inline-form" onSubmit={saveTitle}>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
            <button className="btn primary" disabled={!title.trim()}>
              Guardar
            </button>
            <button type="button" className="btn" onClick={() => setEditingTitle(false)}>
              Cancelar
            </button>
          </form>
        ) : (
          <h2>
            {deck.title}{' '}
            <button
              className="link small"
              onClick={() => {
                setTitle(deck.title);
                setEditingTitle(true);
              }}
            >
              editar
            </button>
          </h2>
        )}
        <button className="btn primary" disabled={dueCount === 0} onClick={onStudy}>
          Estudiar ({dueCount})
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="panel">
        <h3>Agregar card</h3>
        <CardForm
          submitLabel="Agregar"
          onSubmit={async (front, back) => {
            await api.addCard(deck.id, front, back);
            await load();
          }}
        />
        <JsonUpload
          label="Importar cards desde JSON"
          onUpload={async (file) => {
            setDeck(await api.importIntoDeck(deck.id, file));
          }}
        />
      </div>

      <h3>Cards ({deck.cards.length})</h3>
      {deck.cards.length === 0 ? (
        <p className="muted">Este mazo aún no tiene cards.</p>
      ) : (
        <table className="card-table">
          <thead>
            <tr>
              <th>Frente</th>
              <th>Reverso</th>
              <th>Nivel</th>
              <th>Próximo repaso</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {deck.cards.map((card) =>
              editingCardId === card.id ? (
                <tr key={card.id}>
                  <td colSpan={5}>
                    <CardForm
                      initialFront={card.cardFront}
                      initialBack={card.cardBack}
                      submitLabel="Guardar"
                      onCancel={() => setEditingCardId(null)}
                      onSubmit={async (cardFront, cardBack) => {
                        await api.updateCard(deck.id, card.id, { cardFront, cardBack });
                        setEditingCardId(null);
                        await load();
                      }}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={card.id}>
                  <td>{card.cardFront}</td>
                  <td>{card.cardBack}</td>
                  <td>
                    <span className={`badge ${card.level}`}>{LEVEL_LABELS[card.level]}</span>
                  </td>
                  <td className="muted">
                    {new Date(card.nextReview).getTime() <= now ? 'Ahora' : formatDate(card.nextReview)}
                  </td>
                  <td className="actions">
                    <button className="link small" onClick={() => setEditingCardId(card.id)}>
                      Editar
                    </button>
                    <button className="link small danger" onClick={() => deleteCard(card)}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
