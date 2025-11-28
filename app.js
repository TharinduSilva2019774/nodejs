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
const { listTasks, createTask } = require("./models/task"); // Basic in-memory model helpers.

const app = express();
const PORT = process.env.PORT || 3000; // Allow override via PORT env var in production.

// ----- Global middleware (runs for every request) -----
app.use(express.json()); // Parse JSON bodies into req.body.
app.use(morgan("tiny")); // Log method, path, status, and response time.

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
  res.json(listTasks());
});

// POST /api/v1/tasks -> create a new task
// Minimal validation for required fields; adjust as you grow.
app.post("/api/v1/tasks", (req, res) => {
  const { name, note, priority, status } = req.body;
  if (!name || !note || !priority || !status) {
    return res
      .status(400)
      .json({ message: "name, note, priority, and status are required" });
  }

  const newTask = createTask({ name, note, priority, status });
  res.status(201).json(newTask);
});

// ----- 404 handler for any unmatched routes -----
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ----- Start the HTTP server -----
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
