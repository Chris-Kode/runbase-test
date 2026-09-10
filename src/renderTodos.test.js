// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderTodos, createTodoElement } from './renderTodos.js';
import { addTodo, clearTodos } from './addTodo.js';

describe('createTodoElement', () => {
  it('should create an li with data-id matching the todo id', () => {
    const todo = { id: 123, text: 'Buy milk', completed: false };
    const li = createTodoElement(todo);
    expect(li.tagName).toBe('LI');
    expect(li.dataset.id).toBe('123');
  });

  it('should display the todo text in a span.todo-text', () => {
    const todo = { id: 1, text: 'Buy milk', completed: false };
    const li = createTodoElement(todo);
    const span = li.querySelector('.todo-text');
    expect(span).not.toBeNull();
    expect(span.textContent).toBe('Buy milk');
  });

  it('should render an unchecked checkbox for a new todo', () => {
    const todo = { id: 1, text: 'Buy milk', completed: false };
    const li = createTodoElement(todo);
    const checkbox = li.querySelector('.todo-checkbox');
    expect(checkbox).not.toBeNull();
    expect(checkbox.type).toBe('checkbox');
    expect(checkbox.checked).toBe(false);
  });

  it('should render a checked checkbox for a completed todo', () => {
    const todo = { id: 1, text: 'Buy milk', completed: true };
    const li = createTodoElement(todo);
    const checkbox = li.querySelector('.todo-checkbox');
    expect(checkbox.checked).toBe(true);
  });

  it('should render a delete button', () => {
    const todo = { id: 1, text: 'Buy milk', completed: false };
    const li = createTodoElement(todo);
    const deleteBtn = li.querySelector('.delete-btn');
    expect(deleteBtn).not.toBeNull();
    expect(deleteBtn.textContent).toBe('✕');
  });

  it('should set the todo-item class on the li', () => {
    const todo = { id: 1, text: 'Test', completed: false };
    const li = createTodoElement(todo);
    expect(li.classList.contains('todo-item')).toBe(true);
  });

  it('should not add completed class when todo is incomplete', () => {
    const todo = { id: 1, text: 'Buy milk', completed: false };
    const li = createTodoElement(todo, undefined);
    expect(li.classList.contains('completed')).toBe(false);
  });

  it('should add completed class when todo is completed', () => {
    const todo = { id: 1, text: 'Buy milk', completed: true };
    const li = createTodoElement(todo, undefined);
    expect(li.classList.contains('completed')).toBe(true);
  });

  it('should call onToggle with the todo id when checkbox is changed', () => {
    const todo = { id: 42, text: 'Buy milk', completed: false };
    const onToggle = vi.fn();
    const li = createTodoElement(todo, onToggle);
    const checkbox = li.querySelector('.todo-checkbox');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    expect(onToggle).toHaveBeenCalledWith(42);
  });

  it('should call onDelete with the todo id when delete button is clicked', () => {
    const todo = { id: 42, text: 'Buy milk', completed: false };
    const onDelete = vi.fn();
    const li = createTodoElement(todo, undefined, onDelete);
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.click();
    expect(onDelete).toHaveBeenCalledWith(42);
  });

  it('should not throw when onDelete is not provided', () => {
    const todo = { id: 1, text: 'Buy milk', completed: false };
    const li = createTodoElement(todo);
    const deleteBtn = li.querySelector('.delete-btn');
    expect(() => deleteBtn.click()).not.toThrow();
  });

  it('should work without an onToggle callback (backward compatibility)', () => {
    const todo = { id: 1, text: 'Buy milk', completed: false };
    const li = createTodoElement(todo);
    const checkbox = li.querySelector('.todo-checkbox');
    expect(() => {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
    }).not.toThrow();
  });
});

describe('renderTodos', () => {
  beforeEach(() => {
    clearTodos();
    document.body.innerHTML = '<ul id="todo-list"></ul>';
  });

  it('should render each todo as an li inside #todo-list', () => {
    addTodo('Buy milk');
    addTodo('Walk dog');
    renderTodos();
    const list = document.getElementById('todo-list');
    expect(list.children.length).toBe(2);
    expect(list.children[0].querySelector('.todo-text').textContent).toBe('Buy milk');
    expect(list.children[1].querySelector('.todo-text').textContent).toBe('Walk dog');
  });

  it('should clear previous content before re-rendering', () => {
    addTodo('Buy milk');
    addTodo('Walk dog');
    renderTodos();

    clearTodos();
    addTodo('Only this');
    renderTodos();

    const list = document.getElementById('todo-list');
    expect(list.children.length).toBe(1);
    expect(list.querySelector('.todo-text').textContent).toBe('Only this');
  });

  it('should handle an empty todos array', () => {
    renderTodos();
    const list = document.getElementById('todo-list');
    expect(list.innerHTML).toBe('');
  });

  it('should render multiple todos with correct text', () => {
    addTodo('Todo A');
    addTodo('Todo B');
    addTodo('Todo C');
    renderTodos();

    const list = document.getElementById('todo-list');
    expect(list.children.length).toBe(3);

    const texts = Array.from(list.querySelectorAll('.todo-text')).map(
      (el) => el.textContent
    );
    expect(texts).toEqual(['Todo A', 'Todo B', 'Todo C']);
  });

  it('should not throw when #todo-list is missing from the DOM', () => {
    document.body.innerHTML = '';
    addTodo('Should not throw');
    expect(() => renderTodos()).not.toThrow();
  });

  it('should pass onToggle to createTodoElement when provided', () => {
    const onToggle = vi.fn();
    addTodo('Buy milk');
    renderTodos(onToggle);
    const checkbox = document.querySelector('.todo-checkbox');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('should pass onDelete to createTodoElement when provided', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    addTodo('Buy milk');
    renderTodos(onToggle, onDelete);
    const deleteBtn = document.querySelector('.delete-btn');
    deleteBtn.click();
    expect(onDelete).toHaveBeenCalled();
  });

  it('should not throw when onToggle is omitted (backward compatibility)', () => {
    addTodo('Buy milk');
    expect(() => renderTodos()).not.toThrow();
  });
});
