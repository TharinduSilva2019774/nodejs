const taskPriority = Object.freeze({
  HIGH: "HIGH", // 3
  MEDIUM: "MEDIUM", // 2
  LOW: "LOW", // 1
});

/**
 * Convert a numeric priority (1 = LOW, 2 = MEDIUM, 3 = HIGH) to its enum value.
 * @param {1 | 2 | 3} number
 * @returns {keyof typeof taskPriority} // "HIGH" | "MEDIUM" | "LOW"
 */
function convertPriority(number) {
  switch (number) {
    case 3:
      return taskPriority.HIGH;
    case 2:
      return taskPriority.MEDIUM;
    case 1:
      return taskPriority.LOW;
    default:
      throw new Error(`Invalid priority number: ${number}`);
  }
}

const taskStatus = Object.freeze({
  TODO: "TODO", // 1
  IN_PROGRESS: "IN_PROGRESS", // 2
  DONE: "DONE", // 3
});

/**
 * Convert a numeric status (1 = TODO, 2 = IN_PROGRESS, 3 = DONE) to its enum value.
 * @param {1 | 2 | 3} number
 * @returns {keyof typeof taskStatus} // "TODO" | "IN_PROGRESS" | "DONE"
 */
function convertStatus(number) {
  switch (number) {
    case 1:
      return taskStatus.TODO;
    case 2:
      return taskStatus.IN_PROGRESS;
    case 3:
      return taskStatus.DONE;
    default:
      throw new Error(`Invalid status number: ${number}`);
  }
}

exports.taskPriority = taskPriority;
exports.convertPriority = convertPriority;
exports.taskStatus = taskStatus;
exports.convertStatus = convertStatus;
