import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError } from '../crud.js';

// Vista agregada para el Dashboard: una fila por actividad con los datos
// clave de las otras ventanas (estimado vs real, dificultad, conteos).
const router = Router();

router.get('/', async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT a.id, a.titulo, a.descripcion, a.estado, a.fecha,
           p.tiempo_estimado_minutos,
           e.tiempo_real_minutos,
           r.nivel_de_dificultad,
           (SELECT count(*) FROM goals g     WHERE g.planning_id  = p.id)::int AS total_metas,
           (SELECT count(*) FROM resources s WHERE s.planning_id  = p.id)::int AS total_recursos,
           (SELECT count(*) FROM learning_notes n WHERE n.activity_id = a.id)::int AS total_notas
      FROM activities a
      LEFT JOIN plannings   p ON p.activity_id = a.id
      LEFT JOIN executions  e ON e.activity_id = a.id
      LEFT JOIN reflections r ON r.activity_id = a.id
     ORDER BY a.fecha DESC, a.id DESC
  `);
  res.json(rows);
});

// Expediente completo de una misión: se carga al desplegarla en la línea de tiempo.
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const one = (sql) => pool.query(sql, [id]).then((r) => r.rows[0] ?? null);
  const all = (sql) => pool.query(sql, [id]).then((r) => r.rows);

  const [activity, planning, goals, resources, execution, reflection, notes, topics] = await Promise.all([
    one('SELECT * FROM activities WHERE id = $1'),
    one('SELECT * FROM plannings WHERE activity_id = $1'),
    all('SELECT g.* FROM goals g JOIN plannings p ON p.id = g.planning_id WHERE p.activity_id = $1 ORDER BY g.id'),
    all('SELECT s.* FROM resources s JOIN plannings p ON p.id = s.planning_id WHERE p.activity_id = $1 ORDER BY s.id'),
    one('SELECT * FROM executions WHERE activity_id = $1'),
    one('SELECT * FROM reflections WHERE activity_id = $1'),
    all('SELECT * FROM learning_notes WHERE activity_id = $1 ORDER BY id'),
    all('SELECT * FROM study_topics WHERE activity_id = $1 ORDER BY id'),
  ]);
  if (!activity) throw new HttpError(404, `No existe la misión ${id}`);
  res.json({ activity, planning, goals, resources, execution, reflection, notes, topics });
});

export default router;
