import { addTodo, toggleTodo, deleteTodo, todos } from './src/addTodo.js';
import { renderTodos } from './src/renderTodos.js';

function handleToggle(id) {
  toggleTodo(id);
  renderTodos(handleToggle, handleDelete);
}

function handleDelete(id) {
  deleteTodo(id);
  renderTodos(handleToggle, handleDelete);
}

document.addEventListener("DOMContentLoaded", () => {
  const todoInput = document.getElementById("todo-input");
  const todoForm = document.getElementById("todo-form");

  todoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const todo = addTodo(todoInput.value);
    if (todo) {
      todoInput.value = "";
      renderTodos(handleToggle, handleDelete);
    }
  });

  renderTodos(handleToggle, handleDelete);

  console.log("Todo app initialized");
});
