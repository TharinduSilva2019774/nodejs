// In-memory task "model" to keep app.js clean and organized.
// This is not a database; data resets when the server restarts.

const tasks = [
  {
    id: 1,
    name: 'Learn Express basics',
    note: 'Read docs and build a hello world endpoint',
    priority: 'high',
    status: 'in-progress',
  },
];

let nextTaskId = 2;

function listTasks() {
  return tasks;
}

function createTask({ name, note, priority, status }) {
  const newTask = {
    id: nextTaskId++,
    name,
    note,
    priority,
    status,
  };
  tasks.push(newTask);
  return newTask;
}

module.exports = {
  listTasks,
  createTask,
};
