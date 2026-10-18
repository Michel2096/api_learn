// ---- Entidades tal como las devuelve la API (espejo de schema.sql) -------
export type ActivityStatus = 'pendiente' | 'en_progreso' | 'completada';

export interface Activity {
  id: number;
  titulo: string;
  descripcion: string | null;
  estado: ActivityStatus;
  fecha: string;
}

export interface Planning {
  id: number;
  activity_id: number;
  tiempo_estimado_minutos: number;
}

export interface Goal {
  id: number;
  planning_id: number;
  descripcion_meta: string;
  hitos: string | null;
  indicadores_de_exito: string | null;
}

export interface Resource {
  id: number;
  planning_id: number;
  nombre_recurso: string;
  url_o_referencia: string | null;
}

/** Tramo del Bat-cronómetro. `marca` = segundo en que cerró; `duracion` en segundos. */
export interface Lap {
  numero: number;
  marca: number;
  duracion: number;
  tipo: 'auto' | 'manual' | 'final';
}

export interface Execution {
  id: number;
  activity_id: number;
  tiempo_real_minutos: number;
  notas_de_enfoque: string | null;
  prioridades: string | null;
  ajustes: string | null;
  lapsos: Lap[];
}

export interface Reflection {
  id: number;
  activity_id: number;
  resultados_obtenidos: string | null;
  nivel_de_dificultad: number;
  retrospectiva: string | null;
}

export type NoteType = 'aprender_mas' | 'tener_en_cuenta' | 'me_falta';

/** Nota de la bitácora de aprendizaje. Sin `activity_id` es una nota general. */
export interface LearningNote {
  id: number;
  activity_id: number | null;
  tipo: NoteType;
  contenido: string;
  resuelta: boolean;
  creado: string;
}

export type TopicStatus = 'pendiente' | 'en_curso' | 'finalizado';

export interface StudyTopic {
  id: number;
  titulo: string;
  detalle: string | null;
  estado: TopicStatus;
  /** 1 = alta · 2 = media · 3 = baja */
  prioridad: number;
  activity_id: number | null;
  creado: string;
}

/** Fila agregada de GET /api/missions para el Dashboard. */
export interface MissionSummary extends Activity {
  tiempo_estimado_minutos: number | null;
  tiempo_real_minutos: number | null;
  nivel_de_dificultad: number | null;
  total_metas: number;
  total_recursos: number;
  total_notas: number;
}

/** Expediente completo de GET /api/missions/:id. */
export interface MissionDetail {
  activity: Activity;
  planning: Planning | null;
  goals: Goal[];
  resources: Resource[];
  execution: Execution | null;
  reflection: Reflection | null;
  notes: LearningNote[];
  topics: StudyTopic[];
}

// ---- Borradores de formulario que viajan entre ventanas del Wizard -------
export type GoalDraft = Pick<Goal, 'descripcion_meta'> & { hitos: string; indicadores_de_exito: string };
export type ResourceDraft = Pick<Resource, 'nombre_recurso'> & { url_o_referencia: string };

export interface FlightPlan {
  titulo: string;
  descripcion: string;
  tiempoEstimadoMinutos: number;
  goals: GoalDraft[];
  resources: ResourceDraft[];
}

export interface ExecutionDraft {
  notas_de_enfoque: string;
  prioridades: string;
  ajustes: string;
}

export interface ReflectionDraft {
  resultados_obtenidos: string;
  nivel_de_dificultad: number;
  retrospectiva: string;
}

/** Punto de entrada del Wizard al retomar una misión ya empezada. */
export interface ResumeState {
  activityId: number;
  plan: FlightPlan;
  step: 2 | 3;
  elapsedSeconds: number;
}
