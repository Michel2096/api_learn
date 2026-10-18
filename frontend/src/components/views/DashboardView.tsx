import { useState } from 'react';
import type { LearningNote, MissionSummary, StudyTopic } from '../../types';
import Timeline from '../timeline/Timeline';
import { BatButton, EmptyState, SectionTitle } from '../ui';

interface Props {
  missions: MissionSummary[];
  topics: StudyTopic[];
  notes: LearningNote[];
  onDelete: (mission: MissionSummary) => void;
  onResume: (mission: MissionSummary) => void;
  onGoTo: (tab: 'historial' | 'temas' | 'notas') => void;
}

/** Pestaña principal: indicadores y la línea de tiempo de misiones. */
export default function DashboardView({ missions, topics, notes, onDelete, onResume, onGoTo }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allExpanded = missions.length > 0 && missions.every((m) => expanded.has(m.id));
  const toggleAll = () => setExpanded(allExpanded ? new Set() : new Set(missions.map((m) => m.id)));

  const completed = missions.filter((m) => m.estado === 'completada');
  const active = missions.filter((m) => m.estado === 'en_progreso');
  const measured = completed.filter((m) => m.tiempo_estimado_minutos && m.tiempo_real_minutos !== null);
  const avgDeviation = measured.length
    ? Math.round(measured.reduce((acc, m) => acc + (m.tiempo_real_minutos! - m.tiempo_estimado_minutos!), 0) / measured.length)
    : null;
  const openTopics = topics.filter((t) => t.estado !== 'finalizado').length;
  const gaps = notes.filter((n) => n.tipo === 'me_falta' && !n.resuelta).length;

  return (
    <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen">
        <Stat label="Misiones" value={missions.length} hint={`${completed.length} completadas`} />
        <Stat
          label="Desviación media"
          value={avgDeviation === null ? '—' : `${avgDeviation > 0 ? '+' : ''}${avgDeviation}′`}
          hint="real − estimado"
        />
        <Stat label="Temas abiertos" value={openTopics} hint="por estudiar" onClick={() => onGoTo('temas')} />
        <Stat label="Lo que me falta" value={gaps} hint="carencias sin resolver" onClick={() => onGoTo('notas')} />
      </section>

      {active.length > 0 && (
        <section className="hud-frame mt-6 rounded-lg border border-white/40 bg-white/[0.04] p-4 shadow-[0_0_40px_rgba(255,255,255,0.06)]">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white shadow-[0_0_8px_#fff]" />
            Misiones sin cerrar
          </p>
          <ul className="mt-3 space-y-2">
            {active.slice(0, 3).map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3">
                <span className="min-w-0 truncate font-display text-sm font-bold tracking-wide text-white">{m.titulo}</span>
                <BatButton variant="outline" className="!px-3 !py-1.5 !text-[10px]" onClick={() => onResume(m)}>
                  ▶ Retomar
                </BatButton>
              </li>
            ))}
          </ul>
          {active.length > 3 && (
            <BatButton variant="ghost" className="mt-2 !px-0 !py-1 !text-[10px]" onClick={() => onGoTo('historial')}>
              Ver las {active.length} en el historial ▸
            </BatButton>
          )}
        </section>
      )}

      <section className="mt-12">
        <SectionTitle kicker="Registro cronológico" title="Línea de tiempo">
          {missions.length > 0 && (
            <BatButton variant="ghost" className="!px-2 !py-1 !text-[10px]" onClick={toggleAll}>
              {allExpanded ? '▴ Plegar todo' : '▾ Desplegar todo'}
            </BatButton>
          )}
        </SectionTitle>

        {missions.length === 0 ? (
          <EmptyState title="No hay misiones registradas." hint="Gotham espera. Pulsa “Iniciar Nueva Misión”." />
        ) : (
          <Timeline missions={missions} expanded={expanded} onToggle={toggle} onDelete={onDelete} />
        )}
      </section>
    </>
  );
}

function Stat({ label, value, hint, onClick }: { label: string; value: string | number; hint?: string; onClick?: () => void }) {
  const body = (
    <>
      <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">{label}</p>
      <p className="glow mt-1 font-mono text-3xl tabular-nums text-white">{value}</p>
      {hint && <p className="font-mono text-[10px] text-neutral-600">{hint}</p>}
    </>
  );
  const cls = 'hud-card block w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-left';
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} transition hover:border-white/40 hover:bg-white/[0.04]`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}
