import pg from 'pg';

// Los valores por defecto coinciden con docker-compose.yml, así que el
// backend funciona igual dentro de Docker que con `npm run dev` en local.
export const pool = new pg.Pool({
  host: process.env.PGHOST ?? 'localhost',
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? 'batman',
  password: process.env.PGPASSWORD ?? 'gotham',
  database: process.env.PGDATABASE ?? 'batcomputer',
});
