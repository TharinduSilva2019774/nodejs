/**
 * Minimal, starter-friendly Express REST API.
 *
 * How to run (from project root):
 * 1) npm init -y
 * 2) npm install express morgan
 * 3) node app.js
 *
 * This file is the single entry point (common in small apps).
 * In larger apps you might split into:
 *   - /routes (route handlers)
 *   - /controllers (request logic)
 *   - /middlewares (shared middleware)
 *   - /config (env/configuration)
 */

require("dotenv").config(); // Load .env into process.env (keep secrets out of code).
const express = require("express"); // Web framework that simplifies HTTP server creation.
const morgan = require("morgan"); // HTTP request logger for visibility.
const { pool } = require("./config/db"); // Postgres connection pool.
const {
  ensureTasksTable,
  listTasks,
  createTask,
  updateTask,
} = require("./models/task"); // Postgres-backed helpers.
const { convertPriority, convertStatus } = require("./utils/enums");

const app = express();
const PORT = process.env.PORT || 3000; // Allow override via PORT env var in production.
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : ["*"];

// ----- Global middleware (runs for every request) -----
app.use(express.json()); // Parse JSON bodies into req.body.
app.use(morgan("tiny")); // Log method, path, status, and response time.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowAll = allowedOrigins.includes("*");
  const matchedOrigin =
    allowAll || !origin
      ? "*"
      : allowedOrigins.find((allowed) => allowed === origin);

  if (matchedOrigin) {
    res.header("Access-Control-Allow-Origin", matchedOrigin);
  }
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  if (matchedOrigin !== "*") {
    res.header("Access-Control-Allow-Credentials", "true");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // Handle preflight quickly
  }

  next();
});

// ----- Health check (useful for uptime checks) -----
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ----- Hello World route (your first REST endpoint) -----
// Method: GET
// Path: /api/v1/hello
// Response: JSON object with a greeting message.
app.get("/api/v1/hello", (req, res) => {
  res.json({ message: "Hello, World!" });
});

// ----- DB health check (verifies Postgres connectivity) -----
app.get("/api/v1/db-health", async (req, res) => {
  try {
    const { rows } = await pool.query("select 1 as ok");
    res.json({ database: rows[0].ok === 1 ? "up" : "unknown" });
  } catch (err) {
    console.error("DB health check failed", err);
    res
      .status(500)
      .json({ database: "down", error: "Unable to reach database" });
  }
});

// ----- Simple in-memory "Task" routes (model is in /models/task.js) -----
// GET /api/v1/tasks -> list all tasks
app.get("/api/v1/tasks", (req, res) => {
  const { limit } = req.query;
  let parsedLimit;

  if (limit !== undefined) {
    parsedLimit = Number(limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return res
        .status(400)
        .json({ message: "limit must be a positive integer" });
    }
  }

  listTasks(parsedLimit ? { limit: parsedLimit } : undefined)
    .then((tasks) => res.json(tasks))
    .catch((err) => {
      console.error("Failed to fetch tasks", err);
      res.status(500).json({ message: "Failed to fetch tasks" });
    });
});

// POST /api/v1/tasks -> create a new task
// Minimal validation for required fields; adjust as you grow.
app.post("/api/v1/tasks", async (req, res) => {
  // Ensure the client sent JSON; otherwise Express will leave req.body undefined.
  console.log(req.body);
  if (!req.is("application/json")) {
    return res
      .status(415)
      .json({ message: "Content-Type must be application/json" });
  }

  const { name, note, priority, status } = req.body || {};
  if (!name || !note || !priority || !status) {
    return res
      .status(400)
      .json({ message: "name, note, priority, and status are required" });
  }

  try {
    const cPriority = convertPriority(Number(priority));
    const cStatus = convertStatus(Number(status));
    console.log(cPriority, cStatus);
    const newTask = await createTask({
      name,
      note,
      priority: cPriority,
      status: cStatus,
    });
    res.status(201).json(newTask);
  } catch (err) {
    console.error("Failed to create task", err);
    res.status(500).json({ message: "Failed to create task" });
  }
});

// PUT /api/v1/tasks/:id -> update an existing task (partial updates allowed)
app.put("/api/v1/tasks/:id", async (req, res) => {
  if (!req.is("application/json")) {
    return res
      .status(415)
      .json({ message: "Content-Type must be application/json" });
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Task id must be an integer" });
  }

  const { name, note, priority, status } = req.body || {};
  const hasUpdatableField =
    name !== undefined ||
    note !== undefined ||
    priority !== undefined ||
    status !== undefined;

  if (!hasUpdatableField) {
    return res
      .status(400)
      .json({ message: "Provide at least one field to update" });
  }

  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (note !== undefined) updates.note = note;
    if (priority !== undefined)
      updates.priority = convertPriority(Number(priority));
    if (status !== undefined) updates.status = convertStatus(Number(status));

    const updated = await updateTask(id, updates);

    if (!updated) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Failed to update task", err);
    res.status(500).json({ message: "Failed to update task" });
  }
});

// ----- 404 handler for any unmatched routes -----
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ----- Start the HTTP server -----
async function start() {
  try {
    await ensureTasksTable(); // Creates the tasks table if it does not exist.
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server failed to start", err);
    process.exit(1);
  }
}

start();
