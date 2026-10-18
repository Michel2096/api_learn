import { formatClock, formatDuration, formatTimeOfDay } from '../format';

const PRESETS = [15, 25, 45, 60, 90, 120];
const MAX_HOURS = 12;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface TimeSetterProps {
  minutes: number;
  onChange: (minutes: number) => void;
}

/** "Bat-cronómetro" de la Ventana 1: define cuánto durará la misión. */
export default function TimeSetter({ minutes, onChange }: TimeSetterProps) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const setParts = (h: number, m: number) => onChange(clamp(h, 0, MAX_HOURS) * 60 + clamp(m, 0, 59));
  const endsAt = formatTimeOfDay(new Date(Date.now() + minutes * 60_000));

  return (
    <div className="rounded-lg border-2 border-white/60 bg-gradient-to-b from-white/[0.06] to-transparent p-4 shadow-[0_0_30px_rgba(255,255,255,0.12)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xs font-bold uppercase tracking-[0.25em] text-white">
          ⏱ Bat-cronómetro · ¿Cuánto tiempo?
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Obligatorio</span>
      </div>

      <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
        {/* Selectores de horas / minutos */}
        <div className="flex items-center justify-center gap-2">
          <Unit label="Horas" value={hours} onChange={(h) => setParts(h, mins)} step={1} max={MAX_HOURS} />
          <span className="pb-6 font-mono text-4xl text-neutral-600">:</span>
          <Unit label="Min" value={mins} onChange={(m) => setParts(hours, m)} step={5} max={59} />
        </div>

        {/* Vista previa */}
        <div className="rounded-md border border-white/30 bg-black/50 p-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Vista previa de la misión</p>
          <p className={`my-1 font-mono text-4xl tabular-nums ${minutes > 0 ? 'glow-strong text-white' : 'text-neutral-600'}`}>
            {formatClock(minutes * 60)}
          </p>
          <p className="font-mono text-xs text-neutral-400">
            {minutes > 0 ? (
              <>
                {formatDuration(minutes)} · si empiezas ahora terminas a las{' '}
                <span className="text-white">{endsAt}</span>
              </>
            ) : (
              <span className="text-white">Define al menos 1 minuto</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`rounded border px-3 py-1 font-mono text-xs transition ${
              minutes === p
                ? 'border-white bg-white text-black shadow-[0_0_14px_rgba(255,255,255,0.5)]'
                : 'border-neutral-700 text-neutral-400 hover:border-white/60 hover:text-white'
            }`}
          >
            {formatDuration(p)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Unit({
  label,
  value,
  step,
  max,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const arrow =
    'w-full rounded py-0.5 text-neutral-500 transition hover:bg-white/10 hover:text-white disabled:opacity-20';
  return (
    <div className="flex w-20 flex-col items-center gap-1">
      <button type="button" className={arrow} onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label={`Aumentar ${label}`}>
        ▲
      </button>
      <input
        type="number"
        min={0}
        max={max}
        value={String(value).padStart(2, '0')}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 0, 0, max))}
        aria-label={label}
        className="no-spin w-full rounded-md border border-white/30 bg-neutral-950 py-2 text-center font-mono text-4xl tabular-nums text-white outline-none focus:border-white focus:ring-1 focus:ring-white/40"
      />
      <button type="button" className={arrow} onClick={() => onChange(Math.max(0, value - step))} disabled={value <= 0} aria-label={`Disminuir ${label}`}>
        ▼
      </button>
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">{label}</span>
    </div>
  );
}
