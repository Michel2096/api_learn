-- =====================================================================
--  BATCOMPUTER · Seguimiento Digital del Pensamiento Complejo
--  Se ejecuta automáticamente la PRIMERA vez que arranca el contenedor
--  (docker-entrypoint-initdb.d). Para re-ejecutarlo: docker compose down -v
-- =====================================================================

-- 1. Actividades: la "misión" raíz de la que cuelga todo lo demás.
CREATE TABLE IF NOT EXISTS activities (
    id          SERIAL PRIMARY KEY,
    titulo      VARCHAR(200) NOT NULL CHECK (length(trim(titulo)) > 0),
    descripcion TEXT,
    estado      VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente', 'en_progreso', 'completada')),
    fecha       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 2. Planificación (Ventana 1): una por actividad.
CREATE TABLE IF NOT EXISTS plannings (
    id                      SERIAL PRIMARY KEY,
    activity_id             INTEGER NOT NULL UNIQUE REFERENCES activities (id) ON DELETE CASCADE,
    tiempo_estimado_minutos INTEGER NOT NULL CHECK (tiempo_estimado_minutos > 0)
);

-- 3. Metas de la planificación (N por planificación).
CREATE TABLE IF NOT EXISTS goals (
    id                   SERIAL PRIMARY KEY,
    planning_id          INTEGER NOT NULL REFERENCES plannings (id) ON DELETE CASCADE,
    descripcion_meta     TEXT    NOT NULL,
    hitos                TEXT,
    indicadores_de_exito TEXT
);

-- 4. Recursos de la planificación (N por planificación).
CREATE TABLE IF NOT EXISTS resources (
    id               SERIAL PRIMARY KEY,
    planning_id      INTEGER      NOT NULL REFERENCES plannings (id) ON DELETE CASCADE,
    nombre_recurso   VARCHAR(200) NOT NULL,
    url_o_referencia TEXT
);

-- 5. Ejecución (Ventana 2): una por actividad.
CREATE TABLE IF NOT EXISTS executions (
    id                  SERIAL PRIMARY KEY,
    activity_id         INTEGER NOT NULL UNIQUE REFERENCES activities (id) ON DELETE CASCADE,
    tiempo_real_minutos INTEGER NOT NULL CHECK (tiempo_real_minutos >= 0),
    notas_de_enfoque    TEXT,
    prioridades         TEXT,
    ajustes             TEXT
);

-- 6. Reflexión (Ventana 3): una por actividad.
CREATE TABLE IF NOT EXISTS reflections (
    id                   SERIAL PRIMARY KEY,
    activity_id          INTEGER  NOT NULL UNIQUE REFERENCES activities (id) ON DELETE CASCADE,
    resultados_obtenidos TEXT,
    nivel_de_dificultad  SMALLINT NOT NULL CHECK (nivel_de_dificultad BETWEEN 1 AND 5),
    retrospectiva        TEXT
);

CREATE INDEX IF NOT EXISTS idx_goals_planning     ON goals (planning_id);
CREATE INDEX IF NOT EXISTS idx_resources_planning ON resources (planning_id);
CREATE INDEX IF NOT EXISTS idx_activities_fecha   ON activities (fecha DESC);

-- =====================================================================
--  v2 · Lapsos del cronómetro, bitácora de aprendizaje y temas por estudiar.
--  backend/src/migrate.js aplica este mismo bloque al arrancar, así que
--  las BD creadas antes de la v2 se actualizan solas sin `down -v`.
-- =====================================================================

-- Lapsos del Bat-cronómetro: [{ numero, marca, duracion, tipo }] en segundos.
ALTER TABLE executions ADD COLUMN IF NOT EXISTS lapsos JSONB NOT NULL DEFAULT '[]';

-- 7. Bitácora de aprendizaje: notas durante la misión (o generales si activity_id es NULL).
CREATE TABLE IF NOT EXISTS learning_notes (
    id          SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES activities (id) ON DELETE CASCADE,
    tipo        VARCHAR(20) NOT NULL
                CHECK (tipo IN ('aprender_mas', 'tener_en_cuenta', 'me_falta')),
    contenido   TEXT        NOT NULL CHECK (length(trim(contenido)) > 0),
    resuelta    BOOLEAN     NOT NULL DEFAULT false,
    creado      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Temas por estudiar: recordatorios independientes, opcionalmente ligados a una misión.
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
