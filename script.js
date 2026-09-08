document.addEventListener("DOMContentLoaded", () => {
  const todoInput = document.getElementById("todo-input");
  const addButton = document.getElementById("add-btn");
  const todoList = document.getElementById("todo-list");
  const todoForm = document.getElementById("todo-form");

  // Prevent default form submission (page reload).
  todoForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  console.log("Todo app initialized");

  // Todo creation will be added in issue #15.
});
