import { useState, type FormEvent } from 'react';
import type { FlightPlan, GoalDraft, ResourceDraft } from '../../types';
import TimeSetter from '../TimeSetter';
import { BatButton, Field, Panel, TextInput } from '../ui';

// Cada fila de las listas dinámicas lleva una key estable para que React no
// mezcle inputs al borrar una fila intermedia.
type Keyed<T> = T & { key: number };
let nextKey = 0;
const keyed = <T,>(item: T): Keyed<T> => ({ ...item, key: nextKey++ });
const emptyGoal = () => keyed<GoalDraft>({ descripcion_meta: '', hitos: '', indicadores_de_exito: '' });
const emptyResource = () => keyed<ResourceDraft>({ nombre_recurso: '', url_o_referencia: '' });

interface Props {
  saving: boolean;
  onSubmit: (plan: FlightPlan) => void;
}

/** Ventana 1 · Plan de Vuelo — lo que DEBES hacer. */
export default function FlightPlanStep({ saving, onSubmit }: Props) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [minutes, setMinutes] = useState(45);
  const [goals, setGoals] = useState([emptyGoal()]);
  const [resources, setResources] = useState([emptyResource()]);

  const canSubmit = titulo.trim() !== '' && minutes > 0 && !saving;

  function patchGoal(key: number, patch: Partial<GoalDraft>) {
    setGoals((list) => list.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  }
  function patchResource(key: number, patch: Partial<ResourceDraft>) {
    setResources((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      tiempoEstimadoMinutos: minutes,
      // Las filas vacías se descartan.
      goals: goals
        .filter((g) => g.descripcion_meta.trim())
        .map((g) => ({
          descripcion_meta: g.descripcion_meta.trim(),
          hitos: g.hitos.trim(),
          indicadores_de_exito: g.indicadores_de_exito.trim(),
        })),
      resources: resources
        .filter((r) => r.nombre_recurso.trim())
        .map((r) => ({ nombre_recurso: r.nombre_recurso.trim(), url_o_referencia: r.url_o_referencia.trim() })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título de la misión *">
          <TextInput
            autoFocus
            required
            maxLength={200}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Resolver el caso de álgebra lineal"
          />
        </Field>
        <Field label="Descripción">
          <TextInput value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Contexto breve (opcional)" />
        </Field>
      </div>

      <TimeSetter minutes={minutes} onChange={setMinutes} />

      <Panel
        title="◎ ¿Cuáles son tus metas?"
        action={
          <BatButton variant="ghost" className="!px-2 !py-1" onClick={() => setGoals((l) => [...l, emptyGoal()])}>
            + Meta
          </BatButton>
        }
      >
        <div className="space-y-3">
          {goals.map((g, i) => (
            <div key={g.key} className="space-y-2 rounded-md border border-neutral-800 bg-neutral-900/60 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-neutral-300">META_{String(i + 1).padStart(2, '0')}</span>
                {goals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setGoals((l) => l.filter((x) => x.key !== g.key))}
                    className="font-mono text-xs text-neutral-500 hover:text-white"
                  >
                    ✕ quitar
                  </button>
                )}
              </div>
              <TextInput
                value={g.descripcion_meta}
                onChange={(e) => patchGoal(g.key, { descripcion_meta: e.target.value })}
                placeholder="Objetivo: ¿qué quieres lograr?"
                aria-label={`Meta ${i + 1}: objetivo`}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <TextInput
                  value={g.hitos}
                  onChange={(e) => patchGoal(g.key, { hitos: e.target.value })}
                  placeholder="Hitos intermedios"
                  aria-label={`Meta ${i + 1}: hitos`}
                />
                <TextInput
                  value={g.indicadores_de_exito}
                  onChange={(e) => patchGoal(g.key, { indicadores_de_exito: e.target.value })}
                  placeholder="Indicador de éxito: ¿cómo sabré que lo logré?"
                  aria-label={`Meta ${i + 1}: indicador de éxito`}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="⚙ ¿Qué recursos necesitas?"
       
        action={
          <BatButton variant="ghost" className="!px-2 !py-1" onClick={() => setResources((l) => [...l, emptyResource()])}>
            + Recurso
          </BatButton>
        }
      >
        <div className="space-y-2">
          {resources.map((r, i) => (
            <div key={r.key} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
              <TextInput
                value={r.nombre_recurso}
                onChange={(e) => patchResource(r.key, { nombre_recurso: e.target.value })}
                placeholder="Recurso (libro, video, herramienta…)"
                aria-label={`Recurso ${i + 1}: nombre`}
              />
              <TextInput
                value={r.url_o_referencia}
                onChange={(e) => patchResource(r.key, { url_o_referencia: e.target.value })}
                placeholder="URL o referencia"
                aria-label={`Recurso ${i + 1}: URL o referencia`}
              />
              <button
                type="button"
                onClick={() => setResources((l) => l.filter((x) => x.key !== r.key))}
                className="rounded-md px-3 font-mono text-neutral-500 hover:bg-white/10 hover:text-white"
                aria-label={`Quitar recurso ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
          {resources.length === 0 && <p className="font-mono text-xs text-neutral-500">Sin recursos. Añade uno con “+ Recurso”.</p>}
        </div>
      </Panel>

      <div className="flex justify-end border-t border-white/10 pt-4">
        <BatButton type="submit" disabled={!canSubmit}>
          {saving ? 'Guardando plan…' : 'Siguiente: Iniciar Ejecución ▸'}
        </BatButton>
      </div>
    </form>
  );
}
