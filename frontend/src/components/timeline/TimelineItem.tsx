import { useEffect, useState } from 'react';
import { api } from '../../api';
import { formatDuration, formatTimeOfDay } from '../../format';
import type { ActivityStatus, MissionDetail, MissionSummary } from '../../types';
import { DifficultyDots } from '../ui';
import MissionDossier from './MissionDossier';

const STATUS_LABEL: Record<ActivityStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
};

interface Props {
  mission: MissionSummary;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export default function TimelineItem({ mission: m, open, onToggle, onDelete }: Props) {
  const [detail, setDetail] = useState<MissionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // El expediente se pide la primera vez que se despliega y queda en caché.
  useEffect(() => {
    if (!open || detail) return;
    let cancelled = false;
    api
      .getMission(m.id)
      .then((d) => !cancelled && setDetail(d))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [open, detail, m.id]);

  const time = formatTimeOfDay(new Date(m.fecha));
  const est = m.tiempo_estimado_minutos;
  const real = m.tiempo_real_minutos;
  const diff = est !== null && real !== null ? real - est : null;
  const panelId = `mission-${m.id}`;

  return (
    <li className="relative pl-8 sm:pl-10">
      <StatusNode status={m.estado} />

      {/* Hora a la izquierda del eje (solo pantallas anchas) */}
      <span className="absolute -left-24 top-5 hidden w-16 text-right font-mono text-xs text-neutral-500 sm:block">{time}</span>

      <article
        className={`rounded-lg border transition duration-300 ${
          open
            ? 'border-white/70 bg-white/[0.04] shadow-[0_0_36px_rgba(255,255,255,0.12)]'
            : 'border-white/10 bg-neutral-950/80 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)]'
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-start gap-4 rounded-lg p-4 text-left focus-visible:outline-2 focus-visible:outline-white"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              <span>#{String(m.id).padStart(4, '0')}</span>
              <span className="sm:hidden">{time}</span>
              <StatusBadge status={m.estado} />
            </div>
            <h4 className={`mt-1.5 truncate font-display text-sm font-bold tracking-wide sm:text-base ${open ? 'glow text-white' : 'text-neutral-100'}`}>
              {m.titulo}
            </h4>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-neutral-500">
              <span>
                Est. <span className="text-neutral-300">{est !== null ? formatDuration(est) : '—'}</span>
              </span>
              <span>
                Real <span className="text-white">{real !== null ? formatDuration(real) : '—'}</span>
                {diff !== null && diff !== 0 && (
                  <span className={diff > 0 ? 'glow text-white' : 'text-neutral-400'}> ({diff > 0 ? '+' : ''}{diff})</span>
                )}
              </span>
              <DifficultyDots level={m.nivel_de_dificultad} />
            </p>
          </div>
          <span
            aria-hidden="true"
            className={`mt-1 font-mono text-neutral-500 transition-transform duration-300 ${open ? 'rotate-180 text-white' : ''}`}
          >
            ▾
          </span>
        </button>

        {/* Despliegue animado: grid-rows 0fr → 1fr anima hasta la altura real del contenido */}
        <div
          id={panelId}
          role="region"
          aria-label={`Expediente de ${m.titulo}`}
          inert={!open}
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-white/10 px-4 pb-4 pt-5">
              {error ? (
                <p className="font-mono text-sm text-white">⚠ {error}</p>
              ) : detail ? (
                <MissionDossier detail={detail} onDelete={onDelete} />
              ) : (
                <p className="animate-pulse font-mono text-xs uppercase tracking-widest text-neutral-500">Desclasificando expediente…</p>
              )}
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

/** Nodo sobre el eje: lleno = completada, anillo pulsante = en progreso, hueco = pendiente. */
export function StatusNode({ status }: { status: ActivityStatus }) {
  const base = 'absolute left-0 top-6 h-3 w-3 -translate-x-1/2 rounded-full';
  if (status === 'completada') return <span aria-hidden="true" className={`${base} bg-white shadow-[0_0_12px_2px_rgba(255,255,255,0.8)]`} />;
  if (status === 'en_progreso')
    return (
      <span aria-hidden="true" className={`${base} border-2 border-white bg-black`}>
        <span className="absolute inset-0 animate-ping rounded-full bg-white/60" />
      </span>
    );
  return <span aria-hidden="true" className={`${base} border border-white/40 bg-black`} />;
}

export function StatusBadge({ status }: { status: ActivityStatus }) {
  const styles: Record<ActivityStatus, string> = {
    completada: 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.5)]',
    en_progreso: 'border border-white text-white',
    pendiente: 'border border-white/25 text-neutral-500',
  };
  return <span className={`rounded px-1.5 py-px text-[10px] ${styles[status]}`}>{STATUS_LABEL[status]}</span>;
}
