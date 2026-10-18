import type { NoteType, TopicStatus } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export const DIFFICULTY_LABELS = ['Trivial', 'Fácil', 'Moderada', 'Difícil', 'Extrema'];

export const PRIORITY_LABELS = ['Alta', 'Media', 'Baja'];

export const NOTE_TYPES: Record<NoteType, { label: string; icon: string; prompt: string }> = {
  me_falta: { label: 'Lo que me falta', icon: '◌', prompt: '¿Qué no domino todavía? ¿Qué me bloqueó?' },
  aprender_mas: { label: 'Cómo aprender más', icon: '↗', prompt: 'Fuentes, ejercicios o enfoques para profundizar…' },
  tener_en_cuenta: { label: 'Tener en cuenta', icon: '⚑', prompt: 'Temas relacionados que no debo olvidar…' },
};

export const TOPIC_STATUS: Record<TopicStatus, { label: string; icon: string }> = {
  pendiente: { label: 'Pendiente', icon: '○' },
  en_curso: { label: 'En curso', icon: '◐' },
  finalizado: { label: 'Finalizado', icon: '●' },
};

/** 5400 → "01:30:00" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** 90 → "1 h 30 min" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatTimeOfDay(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/** "viernes, 17 de octubre de 2026" */
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Clave de agrupación por día en hora local: "2026-10-17". */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "hace 5 min", "hace 2 días"… */
export function formatRelative(iso: string): string {
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'ahora mismo';
}
