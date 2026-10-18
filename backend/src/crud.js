import { Router } from 'express';
import { pool } from './db.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Genera un router CRUD completo para una tabla.
 *
 * Solo las columnas declaradas en `columns` se aceptan desde el body, así
 * que los nombres que se interpolan en el SQL nunca vienen del cliente;
 * los valores siempre viajan como parámetros ($1, $2...).
 *
 *   GET    /           lista (filtrable por `filters`, ej. ?activity_id=3)
 *   GET    /:id        detalle
 *   POST   /           crear
 *   PUT    /:id        actualizar (parcial)
 *   PATCH  /:id        actualizar (parcial)
 *   DELETE /:id        borrar
 *
 * Las columnas de `json` se serializan antes de enviarlas: node-pg convierte
 * los arrays de JS en arrays de Postgres, no en JSONB.
 */
export function crudRouter({ table, columns, required = [], filters = [], json = [] }) {
  const router = Router();
  const pick = (body = {}) => columns.filter((c) => body[c] !== undefined);
  const value = (body, c) => (json.includes(c) && body[c] !== null ? JSON.stringify(body[c]) : body[c]);

  async function findOr404(id) {
    const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    if (!rows[0]) throw new HttpError(404, `No existe ${table} con id ${id}`);
    return rows[0];
  }

  router.get('/', async (req, res) => {
    const conditions = [];
    const values = [];
    for (const f of filters) {
      if (req.query[f] !== undefined) {
        values.push(req.query[f]);
        conditions.push(`${f} = $${values.length}`);
      }
    }
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT * FROM ${table}${where} ORDER BY id`, values);
    res.json(rows);
  });

  router.get('/:id', async (req, res) => {
    res.json(await findOr404(req.params.id));
  });

  router.post('/', async (req, res) => {
    const body = req.body ?? {};
    const missing = required.filter((c) => body[c] === undefined || body[c] === null || body[c] === '');
    if (missing.length) throw new HttpError(400, `Campos obligatorios: ${missing.join(', ')}`);

    const cols = pick(body);
    const sql = cols.length
      ? `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`
      : `INSERT INTO ${table} DEFAULT VALUES RETURNING *`;
    const { rows } = await pool.query(sql, cols.map((c) => value(body, c)));
    res.status(201).json(rows[0]);
  });

  const update = async (req, res) => {
    const body = req.body ?? {};
    const cols = pick(body);
    if (!cols.length) throw new HttpError(400, `Nada que actualizar. Columnas válidas: ${columns.join(', ')}`);

    const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE ${table} SET ${sets} WHERE id = $${cols.length + 1} RETURNING *`,
      [...cols.map((c) => value(body, c)), req.params.id],
    );
    if (!rows[0]) throw new HttpError(404, `No existe ${table} con id ${req.params.id}`);
    res.json(rows[0]);
  };
  router.put('/:id', update);
  router.patch('/:id', update);

  router.delete('/:id', async (req, res) => {
    const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
    if (!rowCount) throw new HttpError(404, `No existe ${table} con id ${req.params.id}`);
    res.status(204).end();
  });

  return router;
}
