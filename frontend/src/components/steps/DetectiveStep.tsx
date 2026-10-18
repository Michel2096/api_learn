import { useState, type ChangeEvent } from 'react';
import type { ExecutionDraft, FlightPlan, Lap } from '../../types';
import NotesPanel from '../notes/NotesPanel';
import Timer from '../Timer';
import { BatButton, Field, Panel, TextArea } from '../ui';

interface Props {
  activityId: number;
  plan: FlightPlan;
  saving: boolean;
  onSubmit: (draft: ExecutionDraft, elapsedSeconds: number, laps: Lap[]) => void;
}

/**
 * Ventana 2 · Modo Detective — lo que ESTÁS haciendo.
 * Izquierda: reloj, objetivos y autorregulación. Derecha: bitácora de aprendizaje.
 */
export default function DetectiveStep({ activityId, plan, saving, onSubmit }: Props) {
  // null = el temporizador sigue vivo. Solo al detenerlo tenemos tiempo real.
  const [result, setResult] = useState<{ seconds: number; laps: Lap[] } | null>(null);
  const [draft, setDraft] = useState<ExecutionDraft>({ notas_de_enfoque: '', prioridades: '', ajustes: '' });

  const set = (field: keyof ExecutionDraft) => (e: ChangeEvent<HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [field]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-sm text-neutral-400">
        <p>
          Misión activa: <span className="glow text-white">{plan.titulo}</span>
        </p>
        <p className="text-xs text-neutral-600">#{String(activityId).padStart(4, '0')}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Timer
            estimatedSeconds={plan.tiempoEstimadoMinutos * 60}
            onStop={(seconds, laps) => setResult({ seconds, laps })}
          />

          {(plan.goals.length > 0 || plan.resources.length > 0) && (
            <Panel title="◎ Objetivos y recursos">
              <ul className="space-y-1.5 font-mono text-sm">
                {plan.goals.map((g, i) => (
                  <li key={i} className="text-neutral-300">
                    <span className="text-white">▸</span> {g.descripcion_meta}
                    {g.indicadores_de_exito && <span className="text-neutral-500"> — éxito: {g.indicadores_de_exito}</span>}
                  </li>
                ))}
                {plan.resources.map((r, i) => (
                  <li key={`r${i}`} className="text-neutral-400">
                    <span className="text-white">◇</span> {r.nombre_recurso}
                    {r.url_o_referencia && <span className="break-all text-neutral-600"> — {r.url_o_referencia}</span>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="⌁ Autorregulación">
            <div className="space-y-4">
              <Field label="¿En qué te estás enfocando ahora?">
                <TextArea value={draft.notas_de_enfoque} onChange={set('notas_de_enfoque')} placeholder="Estoy analizando…" />
              </Field>
              <Field label="¿Qué prioridades tienes?">
                <TextArea value={draft.prioridades} onChange={set('prioridades')} rows={2} placeholder="1) … 2) …" />
              </Field>
              <Field label="¿Has tenido que ajustar algo?">
                <TextArea value={draft.ajustes} onChange={set('ajustes')} rows={2} placeholder="Cambié de estrategia porque…" />
              </Field>
            </div>
          </Panel>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <NotesPanel activityId={activityId} />
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 border-t border-white/10 pt-4">
        {!result && (
          <p className="font-mono text-xs text-neutral-500">Detén el temporizador con “Finalizar Tarea” para continuar.</p>
        )}
        <BatButton disabled={!result || saving} onClick={() => result && onSubmit(draft, result.seconds, result.laps)}>
          {saving ? 'Guardando…' : 'Finalizar y Reflexionar ▸'}
        </BatButton>
      </div>
    </div>
  );
}
