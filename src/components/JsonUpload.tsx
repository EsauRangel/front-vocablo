import { ChangeEvent, useRef, useState } from 'react';

interface Props {
  label: string;
  onUpload: (file: File) => Promise<void>;
}

/** Botón para seleccionar y subir un archivo .json con cards. */
export function JsonUpload({ label, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload">
      <input ref={inputRef} type="file" accept=".json,application/json" hidden onChange={handleChange} />
      <button className="btn" onClick={() => inputRef.current?.click()} disabled={loading}>
        {loading ? 'Cargando…' : label}
      </button>
      {error && <pre className="error">{error}</pre>}
    </div>
  );
}
