import type { ReactNode } from 'react';
import { formatDuration, NOTE_TYPES, TOPIC_STATUS } from '../../format';
import type { MissionDetail } from '../../types';
import { LapList } from '../Timer';
import { BatButton, DifficultyDots } from '../ui';

interface Props {
  detail: MissionDetail;
  onDelete: () => void;
}

/** Expediente desplegado: las 3 fases de la misión como una mini línea de tiempo. */
export default function MissionDossier({ detail, onDelete }: Props) {
  const { activity, planning, goals, resources, execution, reflection, notes, topics } = detail;

  return (
    <div className="space-y-5">
      {activity.descripcion && <p className="font-mono text-sm text-neutral-300">{activity.descripcion}</p>}

      <ol className="relative space-y-6 border-l border-dashed border-white/20 pl-6">
        <Phase n={1} title="Plan de vuelo" hint="Lo que debías hacer" done={!!planning}>
          {planning && (
            <>
              <Row label="Tiempo estimado">{formatDuration(planning.tiempo_estimado_minutos)}</Row>
              {goals.length > 0 && (
                <div>
                  <Label>Metas</Label>
                  <ul className="mt-1 space-y-2">
                    {goals.map((g) => (
                      <li key={g.id} className="rounded border border-white/10 bg-black/40 px-3 py-2">
                        <p className="text-white">▸ {g.descripcion_meta}</p>
                        {g.hitos && <p className="text-neutral-500">Hitos: <span className="text-neutral-300">{g.hitos}</span></p>}
                        {g.indicadores_de_exito && (
                          <p className="text-neutral-500">Éxito: <span className="text-neutral-300">{g.indicadores_de_exito}</span></p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resources.length > 0 && (
                <div>
                  <Label>Recursos</Label>
                  <ul className="mt-1 space-y-1">
                    {resources.map((r) => (
                      <li key={r.id}>
                        <span className="text-white">◇ {r.nombre_recurso}</span>
                        {r.url_o_referencia && (
                          <>
                            {' — '}
                            {/^https?:\/\//i.test(r.url_o_referencia) ? (
                              <a
                                href={r.url_o_referencia}
                                target="_blank"
                                rel="noreferrer"
                                className="break-all text-neutral-300 underline decoration-white/30 underline-offset-2 hover:text-white hover:decoration-white"
                              >
                                {r.url_o_referencia}
                              </a>
                            ) : (
                              <span className="text-neutral-400">{r.url_o_referencia}</span>
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </Phase>

        <Phase n={2} title="Modo detective" hint="Lo que estabas haciendo" done={!!execution}>
          {execution && (
            <>
              <Row label="Tiempo real">
                {formatDuration(execution.tiempo_real_minutos)}
                {planning && <TimeDelta minutes={execution.tiempo_real_minutos - planning.tiempo_estimado_minutos} />}
              </Row>
              <Text label="Enfoque" value={execution.notas_de_enfoque} />
              <Text label="Prioridades" value={execution.prioridades} />
              <Text label="Ajustes" value={execution.ajustes} />
              {execution.lapsos.length > 1 && (
                <div>
                  <Label>Lapsos ({execution.lapsos.length})</Label>
                  <div className="-mx-1 [&>ol]:mx-0 [&>ol]:max-w-sm">
                    <LapList laps={execution.lapsos} />
                  </div>
                </div>
              )}
            </>
          )}
        </Phase>

        <Phase n={3} title="Informe de caso" hint="Lo que hiciste" done={!!reflection}>
          {reflection && (
            <>
              <Row label="Dificultad">
                <DifficultyDots level={reflection.nivel_de_dificultad} showLabel />
              </Row>
              <Text label="Resultados" value={reflection.resultados_obtenidos} />
              <Text label="Retrospectiva" value={reflection.retrospectiva} />
            </>
          )}
        </Phase>
      </ol>

      {(notes.length > 0 || topics.length > 0) && (
        <div className="grid gap-3 font-mono text-xs sm:grid-cols-2">
          {notes.length > 0 && (
            <div className="rounded-md border border-white/10 bg-black/40 p-3">
              <Label>Bitácora de aprendizaje</Label>
              <ul className="mt-2 space-y-1.5">
                {notes.map((n) => (
                  <li key={n.id} className={n.resuelta ? 'text-neutral-600 line-through' : 'text-neutral-200'}>
                    <span className="text-white" title={NOTE_TYPES[n.tipo].label}>{NOTE_TYPES[n.tipo].icon}</span> {n.contenido}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {topics.length > 0 && (
            <div className="rounded-md border border-white/10 bg-black/40 p-3">
              <Label>Temas relacionados</Label>
              <ul className="mt-2 space-y-1.5">
                {topics.map((t) => (
                  <li key={t.id} className="text-neutral-200">
                    <span className="text-white" title={TOPIC_STATUS[t.estado].label}>{TOPIC_STATUS[t.estado].icon}</span> {t.titulo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end border-t border-white/10 pt-3">
        <BatButton variant="danger" className="!px-3 !py-1.5 !text-[10px]" onClick={onDelete}>
          ✕ Eliminar misión
        </BatButton>
      </div>
    </div>
  );
}

function Phase({ n, title, hint, done, children }: { n: number; title: string; hint: string; done: boolean; children: ReactNode }) {
  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className={`absolute -left-6 top-0 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full font-display text-[10px] font-bold ${
          done ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.7)]' : 'border border-white/25 bg-black text-neutral-600'
        }`}
      >
        {n}
      </span>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h5 className={`font-display text-xs font-bold uppercase tracking-[0.2em] ${done ? 'glow text-white' : 'text-neutral-600'}`}>{title}</h5>
        <span className="font-mono text-[11px] text-neutral-600">{hint}</span>
      </div>
      <div className="mt-2 space-y-2 font-mono text-xs leading-relaxed">
        {done ? children : <p className="text-neutral-600">— Sin registrar (misión interrumpida)</p>}
      </div>
    </li>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <span className="text-[10px] uppercase tracking-widest text-neutral-500">{children}</span>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="flex flex-wrap items-center gap-2">
      <Label>{label}:</Label>
      <span className="text-white">{children}</span>
    </p>
  );
}

function Text({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <Label>{label}</Label>
      <p className="whitespace-pre-line text-neutral-200">{value}</p>
    </div>
  );
}

function TimeDelta({ minutes }: { minutes: number }) {
  if (minutes === 0) return <span className="ml-2 text-neutral-400">(clavado)</span>;
  return (
    <span className={`ml-2 ${minutes > 0 ? 'glow' : 'text-neutral-400'}`}>
      ({minutes > 0 ? '+' : '−'}
      {formatDuration(Math.abs(minutes))} {minutes > 0 ? 'de más' : 'de menos'})
    </span>
  );
}
