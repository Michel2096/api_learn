import { useState } from 'react';
import { api, prepareWizard } from '../../api';
import { formatDuration } from '../../format';
import type { ActivityStatus, MissionSummary, ResumeState } from '../../types';
import { StatusBadge } from '../timeline/TimelineItem';
import { BatButton, Chip, DifficultyDots, EmptyState, ErrorBanner, SectionTitle, TextInput } from '../ui';

type Filter = 'todas' | ActivityStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'en_progreso', label: 'En progreso' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'completada', label: 'Realizadas' },
];

interface Props {
  missions: MissionSummary[];
  onChanged: () => Promise<void>;
  onLaunch: (resume: ResumeState) => void;
  onDelete: (mission: MissionSummary) => void;
}

/** Pestaña Historial: gestionar misiones pasadas — marcarlas como realizadas, retomarlas o repetirlas. */
export default function HistoryView({ missions, onChanged, onLaunch, onDelete }: Props) {
  const [filter, setFilter] = useState<Filter>('todas');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: number, task: () => Promise<void>) {
    setBusy(id);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setBusy(null);
    }
  }

  const setStatus = (m: MissionSummary, estado: ActivityStatus) =>
    act(m.id, async () => {
      await api.updateActivity(m.id, { estado });
      await onChanged();
    });

  const launch = (m: MissionSummary, mode: 'retomar' | 'repetir') =>
    act(m.id, async () => onLaunch(await prepareWizard(m.id, mode)));

  const q = query.trim().toLowerCase();
  const visible = missions.filter(
    (m) =>
      (filter === 'todas' || m.estado === filter) &&
      (!q || m.titulo.toLowerCase().includes(q) || m.descripcion?.toLowerCase().includes(q)),
  );
  const count = (f: Filter) => (f === 'todas' ? missions.length : missions.filter((m) => m.estado === f).length);

  return (
    <section>
      <SectionTitle kicker="Archivo del caso" title="Historial de misiones">
        <TextInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar misión…"
          className="!w-56"
          aria-label="Buscar misión"
        />
      </SectionTitle>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} count={count(f.id)} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState title="No hay misiones con ese filtro." hint="Prueba con otro estado o borra la búsqueda." />
      ) : (
        <ul className="space-y-3">
          {visible.map((m) => {
            const done = m.estado === 'completada';
            return (
              <li
                key={m.id}
                className={`hud-card flex flex-col gap-3 rounded-lg border p-4 transition sm:flex-row sm:items-center ${
                  done ? 'border-white/10 bg-neutral-950/60' : 'border-white/25 bg-white/[0.03]'
                } ${busy === m.id ? 'animate-pulse' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                    <span>#{String(m.id).padStart(4, '0')}</span>
                    <span>{new Date(m.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <StatusBadge status={m.estado} />
                  </div>
                  <h3 className={`mt-1 truncate font-display text-sm font-bold tracking-wide ${done ? 'text-neutral-400' : 'text-white'}`}>
                    {m.titulo}
                  </h3>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-neutral-500">
                    <span>
                      Est. <span className="text-neutral-300">{m.tiempo_estimado_minutos !== null ? formatDuration(m.tiempo_estimado_minutos) : '—'}</span>
                    </span>
                    <span>
                      Real <span className="text-neutral-300">{m.tiempo_real_minutos !== null ? formatDuration(m.tiempo_real_minutos) : '—'}</span>
                    </span>
                    <DifficultyDots level={m.nivel_de_dificultad} />
                    {m.total_notas > 0 && <span>✎ {m.total_notas} nota{m.total_notas === 1 ? '' : 's'}</span>}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {!done && (
                    <>
                      <BatButton className="!px-3 !py-1.5 !text-[10px]" disabled={busy !== null} onClick={() => launch(m, 'retomar')}>
                        ▶ Retomar
                      </BatButton>
                      <BatButton
                        variant="outline"
                        className="!px-3 !py-1.5 !text-[10px]"
                        disabled={busy !== null}
                        onClick={() => setStatus(m, 'completada')}
                      >
                        ✓ Marcar realizada
                      </BatButton>
                    </>
                  )}
                  {/* Solo se reabre lo marcado a mano: con informe de caso ya no queda nada que retomar. */}
                  {done && m.nivel_de_dificultad === null && (
                    <BatButton
                      variant="ghost"
                      className="!px-3 !py-1.5 !text-[10px]"
                      disabled={busy !== null}
                      onClick={() => setStatus(m, 'en_progreso')}
                    >
                      ↺ Reabrir
                    </BatButton>
                  )}
                  <BatButton
                    variant="outline"
                    className="!px-3 !py-1.5 !text-[10px]"
                    disabled={busy !== null}
                    onClick={() => launch(m, 'repetir')}
                    title="Crea una misión nueva con el mismo plan"
                  >
                    ⟳ Repetir
                  </BatButton>
                  <BatButton
                    variant="danger"
                    className="!px-2 !py-1.5 !text-[10px]"
                    disabled={busy !== null}
                    onClick={() => onDelete(m)}
                    aria-label={`Eliminar ${m.titulo}`}
                  >
                    ✕
                  </BatButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
