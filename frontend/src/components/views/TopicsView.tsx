import { useState, type FormEvent } from 'react';
import { api } from '../../api';
import { formatRelative, PRIORITY_LABELS, TOPIC_STATUS } from '../../format';
import type { MissionSummary, StudyTopic, TopicStatus } from '../../types';
import { BatButton, Chip, EmptyState, ErrorBanner, Field, SectionTitle, TextInput, inputClass } from '../ui';

type Filter = 'todos' | TopicStatus | 'relacionados';

const STATUSES = Object.keys(TOPIC_STATUS) as TopicStatus[];
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'en_curso', label: 'En curso' },
  { id: 'finalizado', label: 'Finalizados' },
  { id: 'relacionados', label: 'Relacionados a misión' },
];

interface Props {
  topics: StudyTopic[];
  missions: MissionSummary[];
  onChanged: () => Promise<void>;
}

/** Pestaña Temas por estudiar: recordatorios con estado, prioridad y misión relacionada. */
export default function TopicsView({ topics, missions, onChanged }: Props) {
  const [filter, setFilter] = useState<Filter>('todos');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ titulo: '', detalle: '', prioridad: 2, activity_id: '' });
  const [saving, setSaving] = useState(false);

  async function run(task: () => Promise<unknown>) {
    setError(null);
    try {
      await task();
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setSaving(true);
    await run(async () => {
      await api.createTopic({
        titulo: form.titulo.trim(),
        detalle: form.detalle.trim() || null,
        prioridad: form.prioridad,
        activity_id: form.activity_id ? Number(form.activity_id) : null,
      });
      setForm((f) => ({ ...f, titulo: '', detalle: '' }));
    });
    setSaving(false);
  }

  const missionTitle = new Map(missions.map((m) => [m.id, m.titulo]));
  const matches = (t: StudyTopic, f: Filter) =>
    f === 'todos' || (f === 'relacionados' ? t.activity_id !== null : t.estado === f);
  const visible = topics
    .filter((t) => matches(t, filter))
    .sort((a, b) => STATUSES.indexOf(a.estado) - STATUSES.indexOf(b.estado) || a.prioridad - b.prioridad || b.id - a.id);

  const finished = topics.filter((t) => t.estado === 'finalizado').length;
  const pct = topics.length ? Math.round((finished / topics.length) * 100) : 0;

  return (
    <section>
      <SectionTitle kicker="Expedientes abiertos" title="Temas por estudiar">
        <div className="w-56">
          <div className="flex justify-between font-mono text-[11px] text-neutral-500">
            <span>Dominados</span>
            <span className="text-white">{finished}/{topics.length} · {pct}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-900">
            <div className="h-full bg-white shadow-[0_0_10px_#fff] transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </SectionTitle>

      <form onSubmit={handleSubmit} className="hud-frame mb-6 space-y-3 rounded-lg border border-white/15 bg-white/[0.02] p-4">
        <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
          <Field label="Nuevo tema *">
            <TextInput
              required
              maxLength={200}
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej. Transformaciones lineales y autovalores"
            />
          </Field>
          <Field label="Relacionado con la misión">
            <select
              value={form.activity_id}
              onChange={(e) => setForm((f) => ({ ...f, activity_id: e.target.value }))}
              className={inputClass}
            >
              <option value="">— Ninguna —</option>
              {missions.map((m) => (
                <option key={m.id} value={m.id}>
                  #{m.id} · {m.titulo}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Detalle">
          <TextInput
            value={form.detalle}
            onChange={(e) => setForm((f) => ({ ...f, detalle: e.target.value }))}
            placeholder="¿Por qué importa? ¿Dónde estudiarlo?"
          />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-[11px] uppercase tracking-[0.2em] text-neutral-300">Prioridad</span>
            {PRIORITY_LABELS.map((label, i) => (
              <Chip key={label} active={form.prioridad === i + 1} onClick={() => setForm((f) => ({ ...f, prioridad: i + 1 }))}>
                {label}
              </Chip>
            ))}
          </div>
          <BatButton type="submit" disabled={!form.titulo.trim() || saving}>
            {saving ? 'Guardando…' : '+ Añadir tema'}
          </BatButton>
        </div>
      </form>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} count={topics.filter((t) => matches(t, f.id)).length} onClick={() => setFilter(f.id)}>
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
        <EmptyState
          title={topics.length ? 'Ningún tema con ese filtro.' : 'Aún no hay temas por estudiar.'}
          hint="Añádelos aquí o desde la bitácora de una misión con “→ tema”."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((t) => {
            const done = t.estado === 'finalizado';
            return (
              <li
                key={t.id}
                className={`hud-card flex flex-col rounded-lg border p-4 transition ${
                  done ? 'border-white/10 bg-transparent' : t.estado === 'en_curso' ? 'border-white/50 bg-white/[0.04] shadow-[0_0_24px_rgba(255,255,255,0.06)]' : 'border-white/20 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`font-display text-sm font-bold tracking-wide ${done ? 'text-neutral-500 line-through' : 'text-white'}`}>
                    {t.titulo}
                  </h3>
                  <span
                    className={`shrink-0 rounded px-1.5 py-px font-mono text-[10px] uppercase ${
                      t.prioridad === 1 ? 'bg-white text-black' : t.prioridad === 2 ? 'border border-white/40 text-neutral-300' : 'border border-white/15 text-neutral-500'
                    }`}
                  >
                    {PRIORITY_LABELS[t.prioridad - 1]}
                  </span>
                </div>
                {t.detalle && <p className="mt-1.5 font-mono text-xs text-neutral-400">{t.detalle}</p>}
                <p className="mt-2 flex flex-wrap gap-x-3 font-mono text-[10px] uppercase tracking-wider text-neutral-600">
                  {t.activity_id !== null && <span>◆ {missionTitle.get(t.activity_id) ?? `Misión #${t.activity_id}`}</span>}
                  <span>{formatRelative(t.creado)}</span>
                </p>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <div role="group" aria-label="Estado del tema" className="inline-flex rounded-md border border-white/15 p-0.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={t.estado === s}
                        onClick={() => t.estado !== s && run(() => api.updateTopic(t.id, { estado: s }))}
                        className={`rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                          t.estado === s ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'
                        }`}
                      >
                        {TOPIC_STATUS[s].icon} {TOPIC_STATUS[s].label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => window.confirm(`¿Eliminar el tema "${t.titulo}"?`) && run(() => api.deleteTopic(t.id))}
                    aria-label={`Eliminar ${t.titulo}`}
                    className="rounded px-2 py-1 font-mono text-xs text-neutral-600 hover:bg-white/10 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
