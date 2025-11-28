// Simple Postgres client setup using node-postgres (pg).
// Keep secrets in environment variables; do NOT hardcode credentials.
//
// Required env vars for a hosted DB like Supabase:
//   PGHOST=your-db-host
//   PGPORT=5432
//   PGDATABASE=postgres
//   PGUSER=postgres
//   PGPASSWORD=your_password
//   PGSSLMODE=require   (Supabase typically requires SSL)
//

const { Pool } = require("pg");

// Decide SSL mode. Some hosts (e.g., Supabase) require SSL; local dev often does not.
const sslMode = (process.env.PGSSLMODE || "require").toLowerCase();
const ssl =
  sslMode === "disable"
    ? false
    : {
        rejectUnauthorized: false, // Accept self-signed certs; tighten for production if needed.
      };

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl,
});

module.exports = {
  pool,
};
