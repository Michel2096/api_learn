import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { crudRouter } from './crud.js';
import { migrate } from './migrate.js';
import missionsRouter from './routes/missions.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', db: 'conectada' });
});

// ---- Ventana 1 · Plan de Vuelo ------------------------------------------
app.use('/api/activities', crudRouter({
  table: 'activities',
  columns: ['titulo', 'descripcion', 'estado', 'fecha'],
  required: ['titulo'],
  filters: ['estado'],
}));
app.use('/api/plannings', crudRouter({
  table: 'plannings',
  columns: ['activity_id', 'tiempo_estimado_minutos'],
  required: ['activity_id', 'tiempo_estimado_minutos'],
  filters: ['activity_id'],
}));
app.use('/api/goals', crudRouter({
  table: 'goals',
  columns: ['planning_id', 'descripcion_meta', 'hitos', 'indicadores_de_exito'],
  required: ['planning_id', 'descripcion_meta'],
  filters: ['planning_id'],
}));
app.use('/api/resources', crudRouter({
  table: 'resources',
  columns: ['planning_id', 'nombre_recurso', 'url_o_referencia'],
  required: ['planning_id', 'nombre_recurso'],
  filters: ['planning_id'],
}));

// ---- Ventana 2 · Modo Detective -----------------------------------------
app.use('/api/executions', crudRouter({
  table: 'executions',
  columns: ['activity_id', 'tiempo_real_minutos', 'notas_de_enfoque', 'prioridades', 'ajustes', 'lapsos'],
  required: ['activity_id', 'tiempo_real_minutos'],
  filters: ['activity_id'],
  json: ['lapsos'],
}));
app.use('/api/notes', crudRouter({
  table: 'learning_notes',
  columns: ['activity_id', 'tipo', 'contenido', 'resuelta'],
  required: ['tipo', 'contenido'],
  filters: ['activity_id', 'tipo', 'resuelta'],
}));

// ---- Ventana 3 · Informe de Caso ----------------------------------------
app.use('/api/reflections', crudRouter({
  table: 'reflections',
  columns: ['activity_id', 'resultados_obtenidos', 'nivel_de_dificultad', 'retrospectiva'],
  required: ['activity_id', 'nivel_de_dificultad'],
  filters: ['activity_id'],
}));

// ---- Temas por estudiar --------------------------------------------------
app.use('/api/topics', crudRouter({
  table: 'study_topics',
  columns: ['titulo', 'detalle', 'estado', 'prioridad', 'activity_id'],
  required: ['titulo'],
  filters: ['estado', 'activity_id'],
}));

// ---- Dashboard ----------------------------------------------------------
app.use('/api/missions', missionsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Express 5 propaga automáticamente los errores de handlers async hasta aquí.
const PG_ERRORS = {
  23502: [400, 'Falta un campo obligatorio'],
  23503: [400, 'El registro referenciado no existe'],
  23505: [409, 'Ya existe un registro para esa actividad'],
  23514: [400, 'Un valor está fuera del rango permitido'],
  '22P02': [400, 'Formato de dato inválido'],
};
app.use((err, _req, res, _next) => {
  const mapped = PG_ERRORS[err.code];
  if (mapped) return res.status(mapped[0]).json({ error: mapped[1], detail: err.detail ?? err.message });
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Error interno de la Batcomputer' });
});

const PORT = Number(process.env.PORT ?? 4000);
await migrate().catch((err) => console.error('⚠ No se pudo migrar la BD:', err.message));
app.listen(PORT, () => console.log(`🦇 Batcomputer API escuchando en http://localhost:${PORT}`));
