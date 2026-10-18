# 🦇 Batcomputer · Seguimiento del Pensamiento Complejo y la Metacognición

Wizard de 3 ventanas (Plan de Vuelo → Modo Detective → Informe de Caso) sobre un Dashboard
con cuatro pestañas:

| Pestaña               | Para qué sirve |
|-----------------------|----------------|
| **Batcomputer**       | Indicadores, misiones sin cerrar y línea de tiempo |
| **Historial**         | Marcar misiones como realizadas, retomarlas donde se quedaron, repetirlas o reabrirlas |
| **Temas por estudiar**| Recordatorios con estado (pendiente · en curso · finalizado), prioridad y misión relacionada |
| **Lo que me falta**   | Bitácora de aprendizaje: carencias, cómo aprender más y temas a tener en cuenta |

En el **Modo Detective** el Bat-cronómetro admite **lapsos**: cada N minutos cierra un
tramo, suena un aviso y (con "pausa automática") se detiene hasta pulsar *Continuar*.
Al lado, la bitácora guarda cada nota al momento; cualquier nota puede convertirse en tema (`→ tema`).

```
database/schema.sql        8 tablas (se carga sola la 1ª vez que arranca Postgres)
backend/                   Express 5 + pg  ·  http://localhost:4000/api
frontend/                  React 19 + TS + Vite + Tailwind v4  ·  http://localhost:5173
docker-compose.yml         db + api + web
```

## Arrancar

```bash
docker compose up -d --build      # todo en Docker
# abrir http://localhost:5173
```

Desarrollo local con recarga en caliente (solo la BD en Docker):

```bash
docker compose up -d db
cd backend  && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Las BD creadas antes de la v2 se actualizan solas: al arrancar, el backend aplica
`backend/src/migrate.js` (idempotente). Reiniciar la base de datos desde cero (vuelve a ejecutar `schema.sql`):

```bash
docker compose down -v && docker compose up -d
```

## DBeaver

| Campo      | Valor         |
|------------|---------------|
| Host       | `localhost`   |
| Puerto     | `5432`        |
| Base datos | `batcomputer` |
| Usuario    | `batman`      |
| Contraseña | `gotham`      |

## API

Cada recurso expone `GET /`, `GET /:id`, `POST /`, `PUT|PATCH /:id`, `DELETE /:id`.

| Ruta               | Ventana | Filtros GET      |
|--------------------|---------|------------------|
| `/api/activities`  | 1       | `?estado=`       |
| `/api/plannings`   | 1       | `?activity_id=`  |
| `/api/goals`       | 1       | `?planning_id=`  |
| `/api/resources`   | 1       | `?planning_id=`  |
| `/api/executions`  | 2       | `?activity_id=`  |
| `/api/reflections` | 3       | `?activity_id=`  |
| `/api/notes`       | 2 · Lo que me falta | `?activity_id=` `?tipo=` `?resuelta=` |
| `/api/topics`      | Temas por estudiar  | `?estado=` `?activity_id=` |
| `/api/missions`    | Dashboard (solo `GET`, vista agregada) | |
| `/api/health`      | estado de la conexión a la BD | |

Borrar una actividad elimina en cascada su planificación, metas, recursos, ejecución, reflexión
y notas; sus temas por estudiar se conservan, solo pierden el vínculo.
