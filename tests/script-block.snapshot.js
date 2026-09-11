
      const todos = [];

      function addTodo(text) {
        const trimmed = text.trim();
        if (!trimmed) return;
        const todo = { id: Date.now(), text: trimmed, completed: false };
        todos.push(todo);
        return todo;
      }

      function toggleTodo(id) {
        const todo = todos.find((t) => t.id === id);
        if (!todo) return;
        todo.completed = !todo.completed;
        return todo;
      }

      function deleteTodo(id) {
        const index = todos.findIndex((t) => t.id === id);
        if (index === -1) return;
        return todos.splice(index, 1)[0];
      }

      const STORAGE_KEY = 'todos';

      function loadTodos() {
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

      function saveTodos(todos) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        } catch {
          // Silently ignore storage errors
        }
      }

      function createTodoElement(todo, onToggle, onDelete) {
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

      function renderTodos(onToggle, onDelete) {
        const list = document.getElementById('todo-list');
        if (!list) return;
        list.innerHTML = '';
        todos.forEach((todo) => {
          const li = createTodoElement(todo, onToggle, onDelete);
          list.appendChild(li);
        });
      }

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
      });
    