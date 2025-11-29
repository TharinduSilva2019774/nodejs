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

async function listTasks({ limit } = {}) {
  const hasLimit = Number.isInteger(limit) && limit > 0;
  let sql =
    "select id, name, note, priority, status, created_at from nj_tasks order by created_at desc";
  const params = [];

  if (hasLimit) {
    sql += " limit $1";
    params.push(limit);
  }

  const { rows } = await pool.query(sql, params);
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

async function updateTask(id, { name, note, priority, status }) {
  const sets = [];
  const values = [];

  if (name !== undefined) {
    sets.push(`name = $${sets.length + 1}`);
    values.push(name);
  }
  if (note !== undefined) {
    sets.push(`note = $${sets.length + 1}`);
    values.push(note);
  }
  if (priority !== undefined) {
    sets.push(`priority = $${sets.length + 1}`);
    values.push(priority);
  }
  if (status !== undefined) {
    sets.push(`status = $${sets.length + 1}`);
    values.push(status);
  }

  if (sets.length === 0) {
    throw new Error("No fields provided for update");
  }

  // id is always the last parameter
  values.push(id);
  const idParamIndex = sets.length + 1;

  const { rows } = await pool.query(
    `update nj_tasks
     set ${sets.join(", ")}
     where id = $${idParamIndex}
     returning id, name, note, priority, status, created_at`,
    values
  );
  return rows[0];
}

module.exports = {
  ensureTasksTable,
  listTasks,
  createTask,
  updateTask,
};
