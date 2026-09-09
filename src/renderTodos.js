import { todos } from './addTodo.js';

/**
 * Render all todos into the #todo-list container.
 * Clears existing content first, then rebuilds from the array.
 */
export function renderTodos() {
  const list = document.getElementById('todo-list');
  if (!list) return;
  list.innerHTML = '';
  todos.forEach((todo) => {
    const li = createTodoElement(todo);
    list.appendChild(li);
  });
}

/**
 * Build a single <li> element for a todo.
 * Structure:
 *   <li data-id="{id}" class="todo-item">
 *     <input type="checkbox" class="todo-checkbox" {checked if completed}>
 *     <span class="todo-text">{text}</span>
 *     <button class="delete-btn">✕</button>
 *   </li>
 */
export function createTodoElement(todo) {
  const li = document.createElement('li');
  li.dataset.id = todo.id;
  li.className = 'todo-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.className = 'todo-checkbox';

  const span = document.createElement('span');
  span.className = 'todo-text';
  span.textContent = todo.text;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '✕';

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(deleteBtn);

  return li;
}