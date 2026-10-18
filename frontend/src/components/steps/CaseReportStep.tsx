import { useState, type FormEvent } from 'react';
import { DIFFICULTY_LABELS, formatClock, formatDuration } from '../../format';
import type { ReflectionDraft } from '../../types';
import { BatButton, Field, Panel, TextArea } from '../ui';


interface Props {
  estimatedMinutes: number;
  elapsedSeconds: number;
  saving: boolean;
  onSubmit: (draft: ReflectionDraft) => void;
}

/** Ventana 3 · Informe de Caso — lo que HICISTE. */
export default function CaseReportStep({ estimatedMinutes, elapsedSeconds, saving, onSubmit }: Props) {
  const [draft, setDraft] = useState<ReflectionDraft>({
    resultados_obtenidos: '',
    nivel_de_dificultad: 3,
    retrospectiva: '',
  });

  const estimatedSeconds = estimatedMinutes * 60;
  const diffSeconds = elapsedSeconds - estimatedSeconds;
  const diffMinutes = Math.round(Math.abs(diffSeconds) / 60);
  const scale = Math.max(estimatedSeconds, elapsedSeconds, 1);
  const accuracy = Math.round((Math.min(elapsedSeconds, estimatedSeconds) / scale) * 100);

  const verdict =
    diffMinutes === 0
      ? { text: 'Estimación precisa. Calibración perfecta.', color: 'text-white glow' }
      : diffSeconds > 0
        ? { text: `Te excediste ${formatDuration(diffMinutes)} sobre lo planeado.`, color: 'text-white glow-strong' }
        : { text: `Terminaste ${formatDuration(diffMinutes)} antes de lo planeado.`, color: 'text-neutral-300' };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      ...draft,
      resultados_obtenidos: draft.resultados_obtenidos.trim(),
      retrospectiva: draft.retrospectiva.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Panel title="⇄ Tiempo estimado vs. real">
        <div className="space-y-3">
          <Bar label="Estimado" seconds={estimatedSeconds} scale={scale} color="bg-neutral-600" text="text-neutral-400" />
          <Bar
            label="Real"
            seconds={elapsedSeconds}
            scale={scale}
            color={diffSeconds > 0 ? 'stripes' : 'bg-white shadow-[0_0_10px_#fff]'}
            text="text-white glow"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-neutral-800 pt-3 font-mono text-sm">
          <span className={verdict.color}>{verdict.text}</span>
          <span className="text-neutral-400">
            Precisión de planificación: <span className="text-white">{accuracy}%</span>
          </span>
        </div>
      </Panel>

      <Field label="¿Qué resultados obtuviste?">
        <TextArea
          autoFocus
          value={draft.resultados_obtenidos}
          onChange={(e) => setDraft((d) => ({ ...d, resultados_obtenidos: e.target.value }))}
          placeholder="Logré…, quedó pendiente…"
        />
      </Field>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-[11px] uppercase tracking-[0.2em] text-white">Nivel de dificultad</span>
          <span className="font-mono text-sm text-white">
            {draft.nivel_de_dificultad}/5 · {DIFFICULTY_LABELS[draft.nivel_de_dificultad - 1]}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={draft.nivel_de_dificultad}
          onChange={(e) => setDraft((d) => ({ ...d, nivel_de_dificultad: Number(e.target.value) }))}
          aria-label="Nivel de dificultad"
          className="w-full cursor-pointer accent-white"
        />
        <div className="flex justify-between font-mono text-[10px] uppercase text-neutral-500">
          {DIFFICULTY_LABELS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>

      <Field label="Retrospectiva · ¿Qué aprendiste?">
        <TextArea
          rows={4}
          value={draft.retrospectiva}
          onChange={(e) => setDraft((d) => ({ ...d, retrospectiva: e.target.value }))}
          placeholder="La próxima vez haría distinto…"
        />
      </Field>

      <div className="flex justify-end border-t border-white/10 pt-4">
        <BatButton type="submit" disabled={saving}>
          {saving ? 'Archivando…' : '◆ Guardar Misión'}
        </BatButton>
      </div>
    </form>
  );
}

function Bar({ label, seconds, scale, color, text }: { label: string; seconds: number; scale: number; color: string; text: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 font-mono text-sm">
      <span className="text-neutral-400">{label}</span>
      <div className="h-3 overflow-hidden rounded-full bg-neutral-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(seconds / scale) * 100}%` }} />
      </div>
      <span className={`tabular-nums ${text}`}>{formatClock(seconds)}</span>
    </div>
  );
}
