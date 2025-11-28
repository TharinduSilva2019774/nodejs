// Postgres-backed "Task" helpers. Table is created automatically at startup.
const { pool } = require("../config/db");

const CREATE_TABLE_SQL = `
  create table if not exists nj_tasks (
    id serial primary key,
    name text not null,
    note text not null,
    priority text not null,
    status text not null,
    created_at timestamptz not null default now()
  );
`;

async function ensureTasksTable() {
  await pool.query(CREATE_TABLE_SQL);
}

async function listTasks() {
  const { rows } = await pool.query(
    "select id, name, note, priority, status, created_at from nj_tasks order by id"
  );
  return rows;
}

async function createTask({ name, note, priority, status }) {
  const { rows } = await pool.query(
    `insert into nj_tasks (name, note, priority, status)
     values ($1, $2, $3, $4)
     returning id, name, note, priority, status, created_at`,
    [name, note, priority, status]
  );
  return rows[0];
}

module.exports = {
  ensureTasksTable,
  listTasks,
  createTask,
};
