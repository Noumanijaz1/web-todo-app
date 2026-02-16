/**
 * Canonical task shape on the frontend:
 * id, projectId, title, description, assignedTo, priority, status, dueDate, createdAt
 * (camelCase: assignedTo, projectId, dueDate, createdAt)
 */

/**
 * Normalize a task from the API to the frontend shape.
 * API returns _id, we expose as id; other fields kept as-is (projectId, assignedTo, etc.)
 * @param {Object} raw - Task object from API (may have _id, createdAt, etc.)
 * @returns {Object} Task with id, projectId, title, description, assignedTo, priority, status, dueDate, createdAt
 */
export function normalizeTask(raw) {
  if (!raw) return null
  return {
    id: raw._id ?? raw.id,
    projectId: raw.projectId ?? raw.project_id ?? null,
    title: raw.title ?? '',
    description: raw.description ?? '',
    assignedTo: raw.assignedTo ?? raw.assigned_to ?? null,
    priority: raw.priority ?? 'medium',
    status: raw.status ?? (raw.completed ? 'done' : 'todo'),
    dueDate: raw.dueDate ?? raw.due_date ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    // Keep legacy and extra fields so components don't break
    completed: raw.completed ?? (raw.status === 'done'),
    comments: raw.comments ?? [],
    attachments: raw.attachments ?? [],
    userId: raw.userId ?? raw.user_id ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
    // Preserve _id for API calls that still use it
    _id: raw._id ?? raw.id,
  }
}

/**
 * Normalize a list of tasks from the API.
 * @param {Array} list - Array of task objects from API
 * @returns {Array} Array of normalized tasks
 */
export function normalizeTasks(list) {
  if (!Array.isArray(list)) return []
  return list.map(normalizeTask)
}
