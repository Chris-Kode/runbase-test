export const todos = [];

export function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const todo = { id: Date.now(), text: trimmed, completed: false };
  todos.push(todo);
  return todo;
}

export function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  todo.completed = !todo.completed;
  return todo;
}

export function clearTodos() {
  todos.length = 0;
}
