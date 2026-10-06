
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

      const notes = [];
      const NOTES_KEY = 'notes';
      const MAX_TAGS = 8;
      const MAX_TAG_LENGTH = 24;
      let idCounter = 0;

      function nextId() {
        // Combine the clock with a counter so rapid adds cannot collide.
        return Date.now() * 1000 + (idCounter++ % 1000);
      }

      function parseTags(raw) {
        const seen = new Set();
        const tags = [];
        for (const part of String(raw).split(/[,\s]+/)) {
          const tag = part.trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
          if (!tag || seen.has(tag)) continue;
          seen.add(tag);
          tags.push(tag);
          if (tags.length >= MAX_TAGS) break;
        }
        return tags;
      }

      function addNote(text, rawTags) {
        const trimmed = String(text).trim();
        if (!trimmed) return null;
        const note = {
          id: nextId(),
          text: trimmed,
          tags: parseTags(rawTags),
          createdAt: Date.now(),
        };
        notes.push(note);
        return note;
      }

      function deleteNote(id) {
        const index = notes.findIndex((n) => n.id === id);
        if (index === -1) return undefined;
        return notes.splice(index, 1)[0];
      }

      function loadNotes() {
        try {
          const raw = localStorage.getItem(NOTES_KEY);
          if (raw === null) return [];
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return [];
          return parsed
            .filter((note) => note && typeof note.text === 'string')
            .map((note) => ({
              id:
                typeof note.id === 'number' && Number.isFinite(note.id)
                  ? note.id
                  : nextId(),
              text: note.text,
              tags: Array.isArray(note.tags)
                ? note.tags.filter((tag) => typeof tag === 'string' && tag.trim())
                : [],
              createdAt: note.createdAt,
            }));
        } catch {
          return [];
        }
      }

      function saveNotes(list) {
        try {
          localStorage.setItem(NOTES_KEY, JSON.stringify(list));
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
          // Child animations (e.g. check-pop) bubble, so ignore anything that
          // is not this row's own entrance animation.
          const onRowEnterEnd = (event) => {
            if (event.target !== li || event.animationName !== 'row-enter') return;
            li.removeEventListener('animationend', onRowEnterEnd);
            li.classList.remove('is-entering');
            li.style.removeProperty('--row-delay');
          };
          li.addEventListener('animationend', onRowEnterEnd);
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

      function createNoteElement(note, onDelete, options = {}) {
        const li = document.createElement('li');
        li.dataset.id = note.id;
        li.className = 'note-item';

        const p = document.createElement('p');
        p.className = 'note-text';
        p.textContent = note.text;

        const tags = document.createElement('ul');
        tags.className = 'note-tags';
        (note.tags || []).forEach((tag) => {
          const chip = document.createElement('li');
          chip.className = 'tag-chip';
          chip.textContent = '#' + tag;
          tags.appendChild(chip);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '✕';
        deleteBtn.setAttribute('aria-label', 'Delete note');

        if (onDelete) {
          deleteBtn.addEventListener('click', () => {
            onDelete(note.id);
          });
        }

        li.appendChild(p);
        if (note.tags && note.tags.length) li.appendChild(tags);
        li.appendChild(deleteBtn);

        if (options.entering) {
          const delay = Number.isFinite(options.delay) ? options.delay : 0;
          li.classList.add('is-entering');
          li.style.setProperty('--row-delay', `${delay}ms`);
          const onRowEnterEnd = (event) => {
            if (event.target !== li || event.animationName !== 'row-enter') return;
            li.removeEventListener('animationend', onRowEnterEnd);
            li.classList.remove('is-entering');
            li.style.removeProperty('--row-delay');
          };
          li.addEventListener('animationend', onRowEnterEnd);
        }

        return li;
      }

      function renderNotes(onDelete, entering) {
        const list = document.getElementById('notes-list');
        if (!list) return;
        list.innerHTML = '';
        notes.forEach((note, index) => {
          const shouldEnter = entering instanceof Set && entering.has(note.id);
          const delay = Math.min(index, STAGGER_CAP) * STAGGER_MS;
          const li = createNoteElement(note, onDelete, {
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
        const onGlowEnd = (event) => {
          if (event.target !== li || event.animationName !== 'row-glow') return;
          li.removeEventListener('animationend', onGlowEnd);
          li.classList.remove('just-toggled');
        };
        li.addEventListener('animationend', onGlowEnd);
      }

      function animateRowRemoval(li, finalize) {
        if (li && li.dataset.leaving === '1') return;
        if (!li || prefersReducedMotion()) {
          finalize();
          return;
        }

        li.dataset.leaving = '1';
        let done = false;
        const settle = (event) => {
          // Only the row's own row-leave completion may finalize; child
          // animations bubble and must not settle the row early.
          if (event && (event.target !== li || event.animationName !== 'row-leave')) {
            return;
          }
          if (done) return;
          done = true;
          li.removeEventListener('animationend', settle);
          finalize();
        };

        li.classList.add('is-leaving');
        li.addEventListener('animationend', settle);
        window.setTimeout(settle, 400);
      }

      function handleDelete(id) {
        const li = document.querySelector(`.todo-item[data-id="${id}"]`);
        animateRowRemoval(li, () => {
          deleteTodo(id);
          saveTodos(todos);
          renderTodos(handleToggle, handleDelete);
        });
      }

      function handleDeleteNote(id) {
        const li = document.querySelector(`.note-item[data-id="${id}"]`);
        animateRowRemoval(li, () => {
          deleteNote(id);
          saveNotes(notes);
          renderNotes(handleDeleteNote);
        });
      }

      function setView(view, syncHash = true) {
        const isNotes = view === 'notes';
        const todosView = document.getElementById('todos-view');
        const notesView = document.getElementById('notes-view');
        const tabTodos = document.getElementById('tab-todos');
        const tabNotes = document.getElementById('tab-notes');

        if (todosView) todosView.hidden = isNotes;
        if (notesView) notesView.hidden = !isNotes;

        if (tabTodos) {
          tabTodos.setAttribute('aria-selected', String(!isNotes));
          tabTodos.classList.toggle('is-active', !isNotes);
          tabTodos.tabIndex = isNotes ? -1 : 0;
        }
        if (tabNotes) {
          tabNotes.setAttribute('aria-selected', String(isNotes));
          tabNotes.classList.toggle('is-active', isNotes);
          tabNotes.tabIndex = isNotes ? 0 : -1;
        }

        const title = document.getElementById('app-title');
        const subtitle = document.getElementById('app-subtitle');
        if (title) title.textContent = isNotes ? 'Notes' : 'Todos';
        if (subtitle) {
          subtitle.textContent = isNotes ? 'Jot things down' : 'Stay on top of your day';
        }
        document.title = isNotes ? 'Notes' : 'Todos';

        // Keep the URL in sync so tabs stay bookmarkable/back-button friendly.
        if (syncHash) {
          const hash = isNotes ? '#notes' : '#todos';
          if (window.location.hash !== hash) window.location.hash = hash;
        }
      }

      document.addEventListener("DOMContentLoaded", () => {
        const loaded = loadTodos();
        if (loaded.length) todos.push(...loaded);

        const loadedNotes = loadNotes();
        if (loadedNotes.length) notes.push(...loadedNotes);

        const todoInput = document.getElementById("todo-input");
        const todoForm = document.getElementById("todo-form");
        const noteForm = document.getElementById("note-form");
        const noteInput = document.getElementById("note-input");
        const tagInput = document.getElementById("tag-input");

        todoForm.addEventListener("submit", (event) => {
          event.preventDefault();
          const todo = addTodo(todoInput.value);
          if (todo) {
            todoInput.value = "";
            saveTodos(todos);
            renderTodos(handleToggle, handleDelete, new Set([todo.id]));
          }
        });

        if (noteForm) {
          noteForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const note = addNote(noteInput.value, tagInput.value);
            if (note) {
              noteInput.value = "";
              tagInput.value = "";
              saveNotes(notes);
              renderNotes(handleDeleteNote, new Set([note.id]));
            }
          });
        }

        const tabTodos = document.getElementById("tab-todos");
        const tabNotes = document.getElementById("tab-notes");
        const tabs = [tabTodos, tabNotes].filter(Boolean);

        tabs.forEach((tab) => {
          tab.addEventListener("click", () => {
            setView(tab === tabNotes ? "notes" : "todos");
          });
          tab.addEventListener("keydown", (event) => {
            const index = tabs.indexOf(tab);
            let next = null;
            if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
            else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = tabs.length - 1;
            if (next === null) return;
            event.preventDefault();
            tabs[next].focus();
            setView(next === 1 ? "notes" : "todos");
          });
        });

        window.addEventListener("hashchange", () => {
          setView(window.location.hash === "#notes" ? "notes" : "todos", false);
        });

        setView(window.location.hash === "#notes" ? "notes" : "todos", false);
        renderTodos(handleToggle, handleDelete, new Set(todos.map((t) => t.id)));
        renderNotes(handleDeleteNote, new Set(notes.map((n) => n.id)));
      });
    