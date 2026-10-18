import { dayKey, formatDay } from '../../format';
import type { MissionSummary } from '../../types';
import TimelineItem from './TimelineItem';

interface Props {
  missions: MissionSummary[];
  expanded: Set<number>;
  onToggle: (id: number) => void;
  onDelete: (mission: MissionSummary) => void;
}

/**
 * Eje vertical con las misiones agrupadas por día (más recientes arriba).
 * En pantallas anchas la hora queda a la izquierda del eje y la tarjeta a
 * la derecha; en móvil el eje se pega al borde y la hora va dentro.
 */
export default function Timeline({ missions, expanded, onToggle, onDelete }: Props) {
  // `missions` ya llega ordenado por fecha DESC desde la API.
  const days: { key: string; label: string; items: MissionSummary[] }[] = [];
  for (const m of missions) {
    const key = dayKey(m.fecha);
    const last = days[days.length - 1];
    if (last?.key === key) last.items.push(m);
    else days.push({ key, label: formatDay(m.fecha), items: [m] });
  }

  return (
    <div className="relative ml-2 sm:ml-24">
      <div aria-hidden="true" className="timeline-line absolute bottom-0 left-0 top-0 w-px" />

      <ol className="space-y-10">
        {days.map((day) => (
          <li key={day.key}>
            {/* Marcador de día: rombo reluciente sobre el eje */}
            <div className="relative mb-5 flex items-center pl-8 sm:pl-10">
              <span
                aria-hidden="true"
                className="absolute left-0 h-3 w-3 -translate-x-1/2 rotate-45 border border-white bg-black shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              />
              <h3 className="glow font-display text-xs font-bold uppercase tracking-[0.25em] text-white first-letter:uppercase">
                {day.label}
              </h3>
              <span className="ml-3 font-mono text-[11px] text-neutral-600">
                {day.items.length} misión{day.items.length === 1 ? '' : 'es'}
              </span>
            </div>

            <ol className="space-y-4">
              {day.items.map((m) => (
                <TimelineItem
                  key={m.id}
                  mission={m}
                  open={expanded.has(m.id)}
                  onToggle={() => onToggle(m.id)}
                  onDelete={() => onDelete(m)}
                />
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}
