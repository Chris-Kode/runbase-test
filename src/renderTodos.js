import { todos } from './addTodo.js';

/**
 * Render all todos into the #todo-list container.
 * Clears existing content first, then rebuilds from the array.
 */
export function renderTodos(onToggle, onDelete) {
  const list = document.getElementById('todo-list');
  if (!list) return;
  list.innerHTML = '';
  todos.forEach((todo) => {
    const li = createTodoElement(todo, onToggle, onDelete);
    list.appendChild(li);
  });
}

/**
 * Build a single <li> element for a todo.
 * @param {Object} todo - The todo object.
 * @param {Function} [onToggle] - Optional callback invoked with todo.id when checkbox changes.
 * Structure:
 *   <li data-id="{id}" class="todo-item{ completed}">
 *     <input type="checkbox" class="todo-checkbox" {checked if completed}>
 *     <span class="todo-text">{text}</span>
 *     <button class="delete-btn">✕</button>
 *   </li>
 */
export function createTodoElement(todo, onToggle, onDelete) {
  const li = document.createElement('li');
  li.dataset.id = todo.id;
  li.className = 'todo-item';

  if (todo.completed) {
    li.classList.add('completed');
  }

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.className = 'todo-checkbox';

  if (onToggle) {
    checkbox.addEventListener('change', () => {
      onToggle(todo.id);
    });
  }

  const span = document.createElement('span');
  span.className = 'todo-text';
  span.textContent = todo.text;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '✕';

  if (onDelete) {
    deleteBtn.addEventListener('click', () => {
      onDelete(todo.id);
    });
  }

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(deleteBtn);

  return li;
}
