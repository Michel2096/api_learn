import { useState } from 'react';
import { api } from '../../api';
import { NOTE_TYPES } from '../../format';
import type { LearningNote, MissionSummary, NoteType } from '../../types';
import NoteComposer from '../notes/NoteComposer';
import NoteItem from '../notes/NoteItem';
import { Chip, ErrorBanner, SectionTitle } from '../ui';

interface Props {
  notes: LearningNote[];
  missions: MissionSummary[];
  onChanged: () => Promise<void>;
}

/**
 * Pestaña "Lo que me falta": todas las notas de aprendizaje juntas, las de
 * cada misión y las generales. La columna principal es la de carencias.
 */
export default function NotesView({ notes, missions, onChanged }: Props) {
  const [hideResolved, setHideResolved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const missionTitle = new Map(missions.map((m) => [m.id, m.titulo]));

  async function run(task: () => Promise<unknown>) {
    setError(null);
    try {
      await task();
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  }
  const quiet = (task: () => Promise<unknown>) => void run(task).catch(() => undefined);

  const pendingGaps = notes.filter((n) => n.tipo === 'me_falta' && !n.resuelta).length;
  const resolved = notes.filter((n) => n.resuelta).length;

  function column(tipo: NoteType, featured = false) {
    const list = notes
      .filter((n) => n.tipo === tipo && !(hideResolved && n.resuelta))
      .sort((a, b) => Number(a.resuelta) - Number(b.resuelta) || b.id - a.id);
    return (
      <section
        className={`hud-frame flex flex-col rounded-lg border p-4 ${
          featured ? 'border-white/40 bg-white/[0.04] shadow-[0_0_40px_rgba(255,255,255,0.06)]' : 'border-white/10 bg-white/[0.02]'
        }`}
      >
        <header className="mb-3 flex items-baseline justify-between gap-2">
          <h3 className={`font-display font-bold uppercase tracking-[0.2em] text-white ${featured ? 'glow-strong text-base' : 'glow text-xs'}`}>
            {NOTE_TYPES[tipo].icon} {NOTE_TYPES[tipo].label}
          </h3>
          <span className="font-mono text-[11px] text-neutral-500">{list.length}</span>
        </header>
        <NoteComposer
          tipo={tipo}
          onAdd={(contenido) => run(() => api.createNote({ activity_id: null, tipo, contenido }))}
        />
        <ul className={`mt-3 space-y-2 overflow-y-auto pr-1 ${featured ? 'max-h-[34rem]' : 'max-h-72'}`}>
          {list.map((n) => (
            <NoteItem
              key={n.id}
              note={n}
              missionTitle={n.activity_id !== null ? (missionTitle.get(n.activity_id) ?? null) : null}
              onToggle={() => quiet(() => api.updateNote(n.id, { resuelta: !n.resuelta }))}
              onDelete={() => quiet(() => api.deleteNote(n.id))}
              onPromote={() =>
                run(() => api.createTopic({ titulo: n.contenido.slice(0, 200), detalle: null, activity_id: n.activity_id }))
              }
            />
          ))}
          {list.length === 0 && <li className="py-6 text-center font-mono text-xs text-neutral-600">Nada por aquí.</li>}
        </ul>
      </section>
    );
  }

  return (
    <section>
      <SectionTitle kicker="Bitácora de aprendizaje" title="Lo que me falta">
        <div className="flex items-center gap-3 font-mono text-xs text-neutral-500">
          <span>
            <span className="glow text-white">{pendingGaps}</span> carencias abiertas · {resolved} resueltas
          </span>
          <Chip active={hideResolved} onClick={() => setHideResolved((v) => !v)}>
            Ocultar resueltas
          </Chip>
        </div>
      </SectionTitle>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {column('me_falta', true)}
        <div className="grid gap-4">
          {column('aprender_mas')}
          {column('tener_en_cuenta')}
        </div>
      </div>
    </section>
  );
}
