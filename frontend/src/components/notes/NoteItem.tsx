import { useState } from 'react';
import { formatRelative, NOTE_TYPES } from '../../format';
import type { LearningNote } from '../../types';

interface Props {
  note: LearningNote;
  /** Título de la misión de origen; se muestra solo en la bitácora global. */
  missionTitle?: string | null;
  onToggle: () => void;
  onDelete: () => void;
  /** Convierte la nota en un tema por estudiar. */
  onPromote?: () => Promise<void>;
}

export default function NoteItem({ note, missionTitle, onToggle, onDelete, onPromote }: Props) {
  const [promoted, setPromoted] = useState(false);

  async function promote() {
    try {
      await onPromote?.();
      setPromoted(true);
    } catch {
      // El padre muestra el error.
    }
  }

  return (
    <li
      className={`group rounded-md border px-3 py-2.5 transition ${
        note.resuelta ? 'border-white/5 bg-transparent' : 'border-white/10 bg-white/[0.03] hover:border-white/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={note.resuelta}
          aria-label={note.resuelta ? 'Marcar como pendiente' : 'Marcar como resuelta'}
          className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-sm border text-[10px] transition ${
            note.resuelta ? 'border-white bg-white text-black' : 'border-white/40 text-transparent hover:border-white'
          }`}
        >
          ✓
        </button>
        <div className="min-w-0 flex-1">
          <p className={`whitespace-pre-line font-mono text-sm ${note.resuelta ? 'text-neutral-600 line-through' : 'text-neutral-100'}`}>
            {note.contenido}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 font-mono text-[10px] uppercase tracking-wider text-neutral-600">
            <span>{NOTE_TYPES[note.tipo].icon} {NOTE_TYPES[note.tipo].label}</span>
            {missionTitle !== undefined && <span>{missionTitle ? `◆ ${missionTitle}` : '◇ Nota general'}</span>}
            <span>{formatRelative(note.creado)}</span>
          </p>
        </div>
        <div className="flex shrink-0 gap-1 opacity-60 transition group-hover:opacity-100">
          {onPromote && !note.resuelta && (
            <button
              type="button"
              onClick={() => void promote()}
              disabled={promoted}
              title="Añadir a Temas por estudiar"
              className="rounded px-1.5 font-mono text-[11px] text-neutral-400 hover:bg-white/10 hover:text-white disabled:text-white"
            >
              {promoted ? '✓ tema' : '→ tema'}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            aria-label="Eliminar nota"
            className="rounded px-1.5 font-mono text-xs text-neutral-500 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  );
}
