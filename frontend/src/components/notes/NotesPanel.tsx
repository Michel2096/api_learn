import { useEffect, useState } from 'react';
import { api } from '../../api';
import { NOTE_TYPES } from '../../format';
import type { LearningNote, NoteType } from '../../types';
import { ErrorBanner } from '../ui';
import NoteComposer from './NoteComposer';
import NoteItem from './NoteItem';

const TYPES = Object.keys(NOTE_TYPES) as NoteType[];

/**
 * Bitácora de aprendizaje de la misión en curso. Cada nota se guarda al
 * momento (no espera a "Finalizar"), así nada se pierde si se aborta la misión.
 */
export default function NotesPanel({ activityId }: { activityId: number }) {
  const [notes, setNotes] = useState<LearningNote[]>([]);
  const [tab, setTab] = useState<NoteType>('me_falta');
  const [error, setError] = useState<string | null>(null);

  // Al retomar una misión se recuperan las notas que ya tenía.
  useEffect(() => {
    api.listNotes(activityId).then(setNotes, (err: Error) => setError(err.message));
  }, [activityId]);

  async function guard(task: () => Promise<void>) {
    try {
      setError(null);
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  }

  const add = (contenido: string) =>
    guard(async () => {
      const note = await api.createNote({ activity_id: activityId, tipo: tab, contenido });
      setNotes((list) => [...list, note]);
    });

  const toggle = (n: LearningNote) =>
    guard(async () => {
      const updated = await api.updateNote(n.id, { resuelta: !n.resuelta });
      setNotes((list) => list.map((x) => (x.id === n.id ? updated : x)));
    }).catch(() => undefined);

  const remove = (n: LearningNote) =>
    guard(async () => {
      await api.deleteNote(n.id);
      setNotes((list) => list.filter((x) => x.id !== n.id));
    }).catch(() => undefined);

  const promote = (n: LearningNote) =>
    guard(async () => {
      await api.createTopic({ titulo: n.contenido.slice(0, 200), detalle: null, activity_id: activityId });
    });

  const visible = notes.filter((n) => n.tipo === tab).sort((a, b) => Number(a.resuelta) - Number(b.resuelta) || b.id - a.id);

  return (
    <section className="hud-frame flex h-full flex-col rounded-lg border border-white/15 bg-white/[0.02] p-4">
      <header className="mb-3">
        <h3 className="glow font-display text-xs font-bold uppercase tracking-[0.25em] text-white">✎ Bitácora de aprendizaje</h3>
        <p className="mt-1 font-mono text-[11px] text-neutral-500">Anota mientras trabajas: huecos, rutas para profundizar y temas vecinos.</p>
      </header>

      <div role="tablist" aria-label="Tipo de nota" className="mb-3 grid grid-cols-3 gap-1 rounded-md border border-white/10 p-1">
        {TYPES.map((t) => {
          const pending = notes.filter((n) => n.tipo === t && !n.resuelta).length;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded px-2 py-1.5 font-mono text-[10px] uppercase leading-tight tracking-wider transition ${
                tab === t ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.4)]' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <span className="block text-sm">{NOTE_TYPES[t].icon}</span>
              {NOTE_TYPES[t].label}
              {pending > 0 && <span className={tab === t ? 'text-black/60' : 'text-white'}> · {pending}</span>}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-3">
          <ErrorBanner message={error} />
        </div>
      )}

      <NoteComposer key={tab} tipo={tab} onAdd={add} />

      <ul className="mt-3 max-h-80 flex-1 space-y-2 overflow-y-auto pr-1">
        {visible.map((n) => (
          <NoteItem key={n.id} note={n} onToggle={() => toggle(n)} onDelete={() => remove(n)} onPromote={() => promote(n)} />
        ))}
        {visible.length === 0 && (
          <li className="py-6 text-center font-mono text-xs text-neutral-600">Sin notas de “{NOTE_TYPES[tab].label}” todavía.</li>
        )}
      </ul>
    </section>
  );
}
