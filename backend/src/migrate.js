import { pool } from './db.js';

// Bloque v2 de database/schema.sql. schema.sql solo se ejecuta la PRIMERA vez
// que arranca Postgres; esto pone al día las BD creadas antes de la v2.
// Todo es idempotente (IF NOT EXISTS), así que es seguro en cada arranque.
const V2 = `
  ALTER TABLE executions ADD COLUMN IF NOT EXISTS lapsos JSONB NOT NULL DEFAULT '[]';

  CREATE TABLE IF NOT EXISTS learning_notes (
      id          SERIAL PRIMARY KEY,
      activity_id INTEGER REFERENCES activities (id) ON DELETE CASCADE,
      tipo        VARCHAR(20) NOT NULL
                  CHECK (tipo IN ('aprender_mas', 'tener_en_cuenta', 'me_falta')),
      contenido   TEXT        NOT NULL CHECK (length(trim(contenido)) > 0),
      resuelta    BOOLEAN     NOT NULL DEFAULT false,
      creado      TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS study_topics (
      id          SERIAL PRIMARY KEY,
      titulo      VARCHAR(200) NOT NULL CHECK (length(trim(titulo)) > 0),
      detalle     TEXT,
      estado      VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'en_curso', 'finalizado')),
      prioridad   SMALLINT     NOT NULL DEFAULT 2 CHECK (prioridad BETWEEN 1 AND 3),
      activity_id INTEGER REFERENCES activities (id) ON DELETE SET NULL,
      creado      TIMESTAMPTZ  NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_notes_activity  ON learning_notes (activity_id);
  CREATE INDEX IF NOT EXISTS idx_topics_activity ON study_topics (activity_id);
`;

export async function migrate() {
  await pool.query(V2);
}
