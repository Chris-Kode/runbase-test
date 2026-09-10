/**
 * Persistence layer for todos using localStorage.
 */

const STORAGE_KEY = 'todos';

/**
 * Load todos from localStorage.
 * Returns an empty array when localStorage is empty,
 * contains corrupt JSON, or throws an error.
 * @returns {Array<{id: number, text: string, completed: boolean}>}
 */
export function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Save todos to localStorage.
 * Silently catches errors (e.g. quota exceeded, private browsing).
 * @param {Array<{id: number, text: string, completed: boolean}>} todos
 */
export function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Silently ignore storage errors
  }
}