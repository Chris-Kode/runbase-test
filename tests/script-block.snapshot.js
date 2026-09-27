
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

      function createTodoElement(todo, onToggle, onDelete, options = {}) {
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

        if (options.entering) {
          const delay = Number.isFinite(options.delay) ? options.delay : 0;
          li.classList.add('is-entering');
          li.style.setProperty('--row-delay', `${delay}ms`);
          li.addEventListener(
            'animationend',
            () => {
              li.classList.remove('is-entering');
              li.style.removeProperty('--row-delay');
            },
            { once: true },
          );
        }

        return li;
      }

      const STAGGER_MS = 40;
      const STAGGER_CAP = 8;

      function renderTodos(onToggle, onDelete, entering) {
        const list = document.getElementById('todo-list');
        if (!list) return;
        list.innerHTML = '';
        todos.forEach((todo, index) => {
          const shouldEnter = entering instanceof Set && entering.has(todo.id);
          const delay = Math.min(index, STAGGER_CAP) * STAGGER_MS;
          const li = createTodoElement(todo, onToggle, onDelete, {
            entering: shouldEnter,
            delay,
          });
          list.appendChild(li);
        });
      }

      function prefersReducedMotion() {
        return (
          typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        );
      }

      function handleToggle(id) {
        const todo = toggleTodo(id);
        saveTodos(todos);
        if (!todo) return;

        const li = document.querySelector(`.todo-item[data-id="${id}"]`);
        if (!li) {
          renderTodos(handleToggle, handleDelete);
          return;
        }

        li.classList.toggle('completed', todo.completed);
        const checkbox = li.querySelector('.todo-checkbox');
        if (checkbox) checkbox.checked = todo.completed;

        // Replay the glow on repeated toggles with one forced reflow.
        li.classList.remove('just-toggled');
        void li.offsetWidth;
        li.classList.add('just-toggled');
        li.addEventListener(
          'animationend',
          () => {
            li.classList.remove('just-toggled');
          },
          { once: true },
        );
      }

      function handleDelete(id) {
        const li = document.querySelector(`.todo-item[data-id="${id}"]`);
        const finalize = () => {
          deleteTodo(id);
          saveTodos(todos);
          renderTodos(handleToggle, handleDelete);
        };

        if (li && li.dataset.leaving === '1') return;
        if (!li || prefersReducedMotion()) {
          finalize();
          return;
        }

        li.dataset.leaving = '1';
        let done = false;
        const settle = () => {
          if (done) return;
          done = true;
          finalize();
        };

        li.classList.add('is-leaving');
        li.addEventListener('animationend', settle, { once: true });
        window.setTimeout(settle, 400);
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
            renderTodos(handleToggle, handleDelete, new Set([todo.id]));
          }
        });

        renderTodos(handleToggle, handleDelete, new Set(todos.map((t) => t.id)));
      });
    