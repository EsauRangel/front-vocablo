import { useEffect, useMemo, useState } from 'react';
import { api, Card, RATING_OPTIONS, ReviewRating } from '../api/client';

interface Props {
  deckId: string;
  onExit: () => void;
}

const time = (c: Card) => new Date(c.nextReview).getTime();
// Cards calificadas "Otra vez" / "Difícil" regresan dentro de la misma sesión.
const SESSION_WINDOW_MS = 15 * 60 * 1000;

export function StudySession({ deckId, onExit }: Props) {
  const [queue, setQueue] = useState<Card[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    api
      .studyCards(deckId)
      .then(setQueue)
      .catch((err: Error) => setError(err.message));
  }, [deckId]);

  const { current, nextPending } = useMemo(() => {
    const sorted = [...(queue ?? [])].sort((a, b) => time(a) - time(b));
    return {
      current: sorted.find((c) => time(c) <= now),
      nextPending: sorted.find((c) => time(c) > now && time(c) - now <= SESSION_WINDOW_MS),
    };
  }, [queue, now]);

  // Reloj para la cuenta regresiva mientras se espera a la siguiente card.
  useEffect(() => {
    if (current || !nextPending) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [current, nextPending]);

  const rate = async (rating: ReviewRating) => {
    if (!current || saving) return;
    setSaving(true);
    try {
      const updated = await api.reviewCard(deckId, current.id, rating);
      setQueue((q) =>
        (q ?? [])
          .map((c) => (c.id === updated.id ? updated : c))
          .filter((c) => time(c) - Date.now() <= SESSION_WINDOW_MS),
      );
      setReviewed((n) => n + 1);
      setRevealed(false);
      setNow(Date.now());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <div className="study-header">
      <button className="link" onClick={onExit}>
        ← Salir
      </button>
      <span className="muted">
        Repasadas: {reviewed} · Pendientes: {queue?.length ?? 0}
      </span>
    </div>
  );

  if (error) return <section>{header}<p className="error">{error}</p></section>;
  if (!queue) return <section>{header}<p className="muted">Cargando…</p></section>;

  if (!current) {
    const wait = nextPending ? Math.max(0, time(nextPending) - now) : 0;
    const mm = Math.floor(wait / 60000);
    const ss = String(Math.floor((wait % 60000) / 1000)).padStart(2, '0');
    return (
      <section>
        {header}
        <div className="study-done">
          {nextPending ? (
            <>
              <h2>¡Buen trabajo!</h2>
              <p className="muted">
                La siguiente card vuelve en {mm}:{ss}
              </p>
            </>
          ) : (
            <>
              <h2>🎉 ¡Terminaste por ahora!</h2>
              <p className="muted">No hay más cards pendientes en este mazo.</p>
            </>
          )}
          <button className="btn primary" onClick={onExit}>
            Volver al mazo
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      {header}
      <div
        className={`flashcard ${revealed ? 'revealed' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => setRevealed(true)}
        onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setRevealed(true)}
      >
        <div className="front">{current.cardFront}</div>
        {revealed ? (
          <>
            <hr />
            <div className="back">{current.cardBack}</div>
          </>
        ) : (
          <div className="tap-hint">Toca la card para ver la respuesta</div>
        )}
      </div>

      {revealed && (
        <div className="ratings">
          {RATING_OPTIONS.map((opt) => (
            <button key={opt.rating} className={`rating ${opt.rating}`} disabled={saving} onClick={() => rate(opt.rating)}>
              <span>{opt.label}</span>
              <small>{opt.interval}</small>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
