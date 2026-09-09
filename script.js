import { addTodo, todos } from './src/addTodo.js';
import { renderTodos } from './src/renderTodos.js';

document.addEventListener("DOMContentLoaded", () => {
  const todoInput = document.getElementById("todo-input");
  const todoForm = document.getElementById("todo-form");

  todoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const todo = addTodo(todoInput.value);
    if (todo) {
      todoInput.value = "";
      renderTodos();
    }
  });

  renderTodos();

  console.log("Todo app initialized");
});
