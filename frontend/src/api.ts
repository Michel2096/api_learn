import type {
  Activity,
  Execution,
  FlightPlan,
  Goal,
  LearningNote,
  MissionDetail,
  MissionSummary,
  Planning,
  Reflection,
  Resource,
  ResumeState,
  StudyTopic,
} from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  } catch {
    throw new Error('Sin conexión con la Batcomputer (¿está corriendo el backend?)');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

type New<T> = Omit<T, 'id'>;
/** Para tablas con columnas que rellena la BD (`creado`, flags con DEFAULT). */
type Draft<T, Optional extends keyof T> = Omit<T, 'id' | 'creado' | Optional> & Partial<Pick<T, Optional>>;

export const api = {
  listMissions: () => request<MissionSummary[]>('/missions'),
  getMission: (id: number) => request<MissionDetail>(`/missions/${id}`),

  createActivity: (body: Pick<Activity, 'titulo' | 'descripcion' | 'estado'>) => post<Activity>('/activities', body),
  updateActivity: (id: number, body: Partial<New<Activity>>) => patch<Activity>(`/activities/${id}`, body),
  deleteActivity: (id: number) => request<void>(`/activities/${id}`, { method: 'DELETE' }),

  createPlanning: (body: New<Planning>) => post<Planning>('/plannings', body),
  createGoal: (body: New<Goal>) => post<Goal>('/goals', body),
  createResource: (body: New<Resource>) => post<Resource>('/resources', body),
  createExecution: (body: New<Execution>) => post<Execution>('/executions', body),
  createReflection: (body: New<Reflection>) => post<Reflection>('/reflections', body),

  listNotes: (activityId?: number) => request<LearningNote[]>(activityId ? `/notes?activity_id=${activityId}` : '/notes'),
  createNote: (body: Draft<LearningNote, 'resuelta'>) => post<LearningNote>('/notes', body),
  updateNote: (id: number, body: Partial<Draft<LearningNote, never>>) => patch<LearningNote>(`/notes/${id}`, body),
  deleteNote: (id: number) => request<void>(`/notes/${id}`, { method: 'DELETE' }),

  listTopics: () => request<StudyTopic[]>('/topics'),
  createTopic: (body: Draft<StudyTopic, 'estado' | 'prioridad'>) => post<StudyTopic>('/topics', body),
  updateTopic: (id: number, body: Partial<Draft<StudyTopic, never>>) => patch<StudyTopic>(`/topics/${id}`, body),
  deleteTopic: (id: number) => request<void>(`/topics/${id}`, { method: 'DELETE' }),
};

/**
 * Guarda la Ventana 1 completa: actividad → planificación → metas + recursos.
 * Si algo falla a mitad, borra la actividad (ON DELETE CASCADE limpia el resto)
 * para que reintentar no deje misiones duplicadas.
 */
export async function saveFlightPlan(plan: FlightPlan): Promise<number> {
  const activity = await api.createActivity({
    titulo: plan.titulo,
    descripcion: plan.descripcion || null,
    estado: 'en_progreso',
  });
  try {
    const planning = await api.createPlanning({
      activity_id: activity.id,
      tiempo_estimado_minutos: plan.tiempoEstimadoMinutos,
    });
    await Promise.all([
      ...plan.goals.map((g) =>
        api.createGoal({
          planning_id: planning.id,
          descripcion_meta: g.descripcion_meta,
          hitos: g.hitos || null,
          indicadores_de_exito: g.indicadores_de_exito || null,
        }),
      ),
      ...plan.resources.map((r) =>
        api.createResource({
          planning_id: planning.id,
          nombre_recurso: r.nombre_recurso,
          url_o_referencia: r.url_o_referencia || null,
        }),
      ),
    ]);
    return activity.id;
  } catch (err) {
    await api.deleteActivity(activity.id).catch(() => undefined);
    throw err;
  }
}

/** Reconstruye el plan de vuelo de una misión guardada (para retomarla o repetirla). */
export function planFromDetail({ activity, planning, goals, resources }: MissionDetail): FlightPlan {
  return {
    titulo: activity.titulo,
    descripcion: activity.descripcion ?? '',
    tiempoEstimadoMinutos: planning?.tiempo_estimado_minutos ?? 25,
    goals: goals.map((g) => ({
      descripcion_meta: g.descripcion_meta,
      hitos: g.hitos ?? '',
      indicadores_de_exito: g.indicadores_de_exito ?? '',
    })),
    resources: resources.map((r) => ({ nombre_recurso: r.nombre_recurso, url_o_referencia: r.url_o_referencia ?? '' })),
  };
}

/**
 * Prepara el Wizard a partir de una misión del historial.
 *   'repetir' → nueva misión con el mismo plan, directa al Modo Detective.
 *   'retomar' → sigue donde se quedó: sin ejecución → Modo Detective,
 *               con ejecución pero sin reflexión → Informe de Caso.
 * Una misión que ya tiene reflexión no tiene nada que retomar, así que se repite.
 */
export async function prepareWizard(missionId: number, mode: 'retomar' | 'repetir'): Promise<ResumeState> {
  const detail = await api.getMission(missionId);
  const plan = planFromDetail(detail);

  if (mode === 'repetir' || detail.reflection || !detail.planning) {
    return { activityId: await saveFlightPlan(plan), plan, step: 2, elapsedSeconds: 0 };
  }
  if (detail.activity.estado !== 'en_progreso') await api.updateActivity(missionId, { estado: 'en_progreso' });
  return detail.execution
    ? { activityId: missionId, plan, step: 3, elapsedSeconds: detail.execution.tiempo_real_minutos * 60 }
    : { activityId: missionId, plan, step: 2, elapsedSeconds: 0 };
}
