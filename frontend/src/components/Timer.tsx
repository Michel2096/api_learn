import { useEffect, useState } from 'react';
import { formatClock } from '../format';
import type { Lap } from '../types';
import { BatButton } from './ui';

type TimerStatus = 'running' | 'paused' | 'stopped';

/** Duraciones de lapso ofrecidas, en minutos. 0 = sin lapsos automáticos. */
const LAP_OPTIONS = [0, 5, 10, 15, 25, 30, 45];

interface TimerProps {
  /** Tiempo planificado en la Ventana 1, en segundos. */
  estimatedSeconds: number;
  /** Se llama una sola vez al pulsar "Finalizar Tarea" con el tiempo real trabajado y sus lapsos. */
  onStop: (elapsedSeconds: number, laps: Lap[]) => void;
}

/**
 * Cuenta regresiva desde el tiempo estimado. Si se agota, sigue contando
 * en rojo como "tiempo extra" para que el tiempo real quede bien medido.
 *
 * El tiempo NO se calcula sumando ticks (los navegadores ralentizan los
 * intervalos en pestañas en segundo plano), sino con marcas de Date.now():
 *   transcurrido = acumuladoDeTramosAnteriores + (ahora - inicioDelTramoActual)
 *
 * Lapsos: cada N minutos de trabajo se cierra un tramo, suena un aviso y (si
 * "pausa automática" está activa) el reloj se detiene hasta pulsar Continuar.
 * Las pausas no cuentan como tiempo trabajado.
 */
export default function Timer({ estimatedSeconds, onStop }: TimerProps) {
  const [status, setStatus] = useState<TimerStatus>('running');
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [segmentStart, setSegmentStart] = useState<number | null>(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [pausedAt, setPausedAt] = useState<number | null>(null);

  const [lapMinutes, setLapMinutes] = useState(0);
  const [autoPause, setAutoPause] = useState(true);
  const [laps, setLaps] = useState<Lap[]>([]);
  /** Número del lapso que provocó la pausa actual (para el aviso de descanso). */
  const [lapBreak, setLapBreak] = useState<number | null>(null);

  // El intervalo vive mientras el reloj no esté finalizado: en pausa sigue
  // refrescando para mostrar cuánto llevas de descanso.
  useEffect(() => {
    if (status === 'stopped') return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [status]);

  const elapsedMs = accumulatedMs + (segmentStart !== null ? now - segmentStart : 0);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const remainingSeconds = estimatedSeconds - elapsedSeconds;
  const overtime = remainingSeconds < 0;
  const progress = Math.min(100, (elapsedSeconds / estimatedSeconds) * 100);

  const lapSeconds = lapMinutes * 60;
  const lastMark = laps.length ? laps[laps.length - 1].marca : 0;
  const lapElapsed = elapsedSeconds - lastMark;

  function pushLap(tipo: Lap['tipo'], marca: number): Lap[] {
    const next = [...laps, { numero: laps.length + 1, marca, duracion: marca - lastMark, tipo }];
    setLaps(next);
    return next;
  }

  // Cierre automático del lapso al cumplir N minutos desde la última marca.
  useEffect(() => {
    if (status !== 'running' || !lapSeconds || lapElapsed < lapSeconds) return;
    const lap = pushLap('auto', lastMark + lapSeconds);
    beep();
    if (autoPause) {
      pause();
      setLapBreak(lap.length);
    }
    // Solo debe reaccionar al avance del reloj; el resto se lee del render actual.
  }, [status, lapSeconds, lapElapsed]);

  /** Cierra el tramo actual sumándolo al acumulado y devuelve el total en ms. */
  function closeSegment(): number {
    const t = Date.now();
    const total = accumulatedMs + (segmentStart !== null ? t - segmentStart : 0);
    setAccumulatedMs(total);
    setSegmentStart(null);
    setNow(t);
    return total;
  }

  function pause() {
    closeSegment();
    setPausedAt(Date.now());
    setStatus('paused');
  }

  function resume() {
    const t = Date.now();
    setSegmentStart(t);
    setNow(t);
    setPausedAt(null);
    setLapBreak(null);
    setStatus('running');
  }

  function stop() {
    const total = Math.floor(closeSegment() / 1000);
    setPausedAt(null);
    setLapBreak(null);
    setStatus('stopped');
    // El tramo en curso también cuenta como lapso para que la suma cuadre con el total.
    onStop(total, total > lastMark ? pushLap('final', total) : laps);
  }

  // Sin colores: el estado se comunica con intensidad del brillo, parpadeo e inversión.
  const clockColor = overtime
    ? 'text-white glow-strong'
    : status === 'running'
      ? 'text-white glow'
      : 'text-neutral-500';

  const statusLabel = {
    running: overtime ? '● TIEMPO EXTRA' : '● EN CURSO',
    paused: lapBreak ? `☕ DESCANSO · LAPSO ${lapBreak}` : '❚❚ EN PAUSA',
    stopped: '■ FINALIZADO',
  }[status];

  return (
    <div className="hud-frame rounded-lg border border-white/20 bg-black p-5 text-center shadow-[inset_0_0_40px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest">
        <span className="text-neutral-600">Bat-cronómetro</span>
        <span
          className={
            overtime || lapBreak
              ? 'rounded bg-white px-2 py-0.5 text-black shadow-[0_0_14px_#fff]'
              : status === 'running'
                ? 'animate-pulse text-white'
                : 'text-neutral-400'
          }
        >
          {statusLabel}
        </span>
      </div>

      <div
        role="timer"
        aria-live="off"
        className={`my-4 font-mono text-5xl tabular-nums sm:text-7xl ${clockColor} ${overtime && status === 'running' ? 'animate-pulse' : ''}`}
      >
        {overtime ? '+' : ''}
        {formatClock(Math.abs(remainingSeconds))}
      </div>

      <div className="mx-auto h-1.5 w-full max-w-md overflow-hidden rounded-full bg-neutral-900">
        <div
          className={`h-full transition-[width] duration-300 ${overtime ? 'stripes' : 'bg-white shadow-[0_0_10px_#fff]'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <dl className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1 font-mono text-xs text-neutral-500">
        <div>
          <dt className="inline">Estimado: </dt>
          <dd className="inline text-neutral-300">{formatClock(estimatedSeconds)}</dd>
        </div>
        <div>
          <dt className="inline">Transcurrido: </dt>
          <dd className="inline text-white">{formatClock(elapsedSeconds)}</dd>
        </div>
        {lapSeconds > 0 && status !== 'stopped' && (
          <div>
            <dt className="inline">Lapso {laps.length + 1}: </dt>
            <dd className="inline text-white">
              {formatClock(Math.min(lapElapsed, lapSeconds))} / {formatClock(lapSeconds)}
            </dd>
          </div>
        )}
      </dl>

      {/* Aviso de descanso: el reloj de trabajo está congelado, este cuenta la pausa */}
      {lapBreak && pausedAt && (
        <div className="modal-in mx-auto mt-4 max-w-md rounded-md border border-white/60 bg-white/[0.05] p-3 font-mono text-xs text-neutral-300">
          <p className="text-white glow">Lapso {lapBreak} completado · {lapMinutes} min de trabajo enfocado</p>
          <p className="mt-1">
            Descansando <span className="tabular-nums text-white">{formatClock((now - pausedAt) / 1000)}</span> — respira,
            anota lo que te falta y pulsa <span className="text-white">Continuar</span>.
          </p>
        </div>
      )}

      {status !== 'stopped' && (
        <>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {status === 'running' ? (
              <>
                <BatButton variant="outline" onClick={pause}>❚❚ Pausa</BatButton>
                <BatButton variant="ghost" onClick={() => pushLap('manual', elapsedSeconds)} disabled={lapElapsed < 1}>
                  ⚑ Marcar lapso
                </BatButton>
              </>
            ) : (
              <BatButton variant="outline" onClick={resume}>▶ {lapBreak ? 'Continuar' : 'Reanudar'}</BatButton>
            )}
            <BatButton variant="danger" onClick={stop}>■ Finalizar Tarea</BatButton>
          </div>

          <fieldset className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-4">
            <legend className="sr-only">Configurar lapsos</legend>
            <span className="mr-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">Lapso cada</span>
            {LAP_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setLapMinutes(m)}
                aria-pressed={lapMinutes === m}
                className={`rounded border px-2 py-0.5 font-mono text-[11px] transition ${
                  lapMinutes === m
                    ? 'border-white bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                    : 'border-neutral-800 text-neutral-500 hover:border-white/50 hover:text-white'
                }`}
              >
                {m ? `${m}′` : 'Off'}
              </button>
            ))}
            <label className="ml-2 inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-neutral-400">
              <input
                type="checkbox"
                checked={autoPause}
                onChange={(e) => setAutoPause(e.target.checked)}
                className="accent-white"
              />
              Pausa automática
            </label>
          </fieldset>
        </>
      )}

      {laps.length > 0 && <LapList laps={laps} />}
    </div>
  );
}

export function LapList({ laps }: { laps: Lap[] }) {
  const longest = Math.max(...laps.map((l) => l.duracion), 1);
  return (
    <ol className="mx-auto mt-4 max-w-md space-y-1 text-left font-mono text-[11px]">
      {laps.map((l) => (
        <li key={l.numero} className="grid grid-cols-[3.5rem_1fr_4.5rem_1rem] items-center gap-2 text-neutral-400">
          <span>L{String(l.numero).padStart(2, '0')}</span>
          <span className="h-1 overflow-hidden rounded-full bg-neutral-900">
            <span className="block h-full bg-white/70" style={{ width: `${(l.duracion / longest) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums text-white">{formatClock(l.duracion)}</span>
          <span title={{ auto: 'Lapso automático', manual: 'Marcado a mano', final: 'Tramo final' }[l.tipo]}>
            {{ auto: '⟳', manual: '⚑', final: '■' }[l.tipo]}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Aviso sonoro corto al cerrar un lapso (sin assets: un seno de 880 Hz con caída). */
function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    osc.connect(gain).connect(ctx.destination);
    osc.onended = () => void ctx.close();
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  } catch {
    // Sin audio disponible: el aviso visual basta.
  }
}
