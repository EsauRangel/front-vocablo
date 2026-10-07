import { FormEvent, useState } from 'react';

interface Props {
  initialFront?: string;
  initialBack?: string;
  submitLabel: string;
  onSubmit: (cardFront: string, cardBack: string) => Promise<void>;
  onCancel?: () => void;
}

export function CardForm({ initialFront = '', initialBack = '', submitLabel, onSubmit, onCancel }: Props) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(front.trim(), back.trim());
      if (!onCancel) {
        setFront('');
        setBack('');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card-form" onSubmit={handleSubmit}>
      <input placeholder="Frente (cardFront)" value={front} onChange={(e) => setFront(e.target.value)} />
      <input placeholder="Reverso (cardBack)" value={back} onChange={(e) => setBack(e.target.value)} />
      <button className="btn primary" disabled={saving || !front.trim() || !back.trim()}>
        {submitLabel}
      </button>
      {onCancel && (
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
      )}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
