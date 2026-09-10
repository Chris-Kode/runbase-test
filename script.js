import { addTodo, toggleTodo, deleteTodo, todos } from './src/addTodo.js';
import { renderTodos } from './src/renderTodos.js';
import { loadTodos, saveTodos } from './src/storage.js';

function handleToggle(id) {
  toggleTodo(id);
  saveTodos(todos);
  renderTodos(handleToggle, handleDelete);
}

function handleDelete(id) {
  deleteTodo(id);
  saveTodos(todos);
  renderTodos(handleToggle, handleDelete);
}

document.addEventListener("DOMContentLoaded", () => {
  const loaded = loadTodos();
  if (loaded.length) todos.push(...loaded);

  const todoInput = document.getElementById("todo-input");
  const todoForm = document.getElementById("todo-form");

  todoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const todo = addTodo(todoInput.value);
    if (todo) {
      todoInput.value = "";
      saveTodos(todos);
      renderTodos(handleToggle, handleDelete);
    }
  });

  renderTodos(handleToggle, handleDelete);

  console.log("Todo app initialized");
});
