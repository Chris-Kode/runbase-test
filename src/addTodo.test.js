import { describe, it, expect, beforeEach } from 'vitest';
import { addTodo, toggleTodo, todos, clearTodos } from './addTodo.js';

describe('addTodo', () => {
  beforeEach(() => {
    clearTodos();
  });

  it('should create a todo with the correct structure', () => {
    const todo = addTodo('Buy milk');
    expect(todo).toBeDefined();
    expect(todo.text).toBe('Buy milk');
    expect(todo.completed).toBe(false);
    expect(typeof todo.id).toBe('number');
  });

  it('should add the todo to the todos array', () => {
    addTodo('Buy milk');
    expect(todos).toHaveLength(1);
    expect(todos[0].text).toBe('Buy milk');
  });

  it('should trim whitespace from todo text', () => {
    const todo = addTodo('  Buy milk  ');
    expect(todo.text).toBe('Buy milk');
  });

  it('should ignore empty strings', () => {
    const result = addTodo('');
    expect(result).toBeUndefined();
    expect(todos).toHaveLength(0);
  });

  it('should ignore whitespace-only strings', () => {
    const result = addTodo('   ');
    expect(result).toBeUndefined();
    expect(todos).toHaveLength(0);
  });

  it('should allow multiple todos to be added', () => {
    addTodo('Todo A');
    addTodo('Todo B');
    expect(todos).toHaveLength(2);
    expect(todos[0].text).toBe('Todo A');
    expect(todos[1].text).toBe('Todo B');
  });

  it('should assign a numeric id based on Date.now()', () => {
    const todo = addTodo('First');
    expect(typeof todo.id).toBe('number');
    expect(todo.id).toBeGreaterThan(0);
  });

  it('should create distinct todo objects for each add', () => {
    const todo1 = addTodo('First');
    const todo2 = addTodo('Second');
    expect(todo1).not.toBe(todo2);
  });
});

describe('toggleTodo', () => {
  beforeEach(() => {
    clearTodos();
  });

  it('should toggle a todo from incomplete to completed', () => {
    const todo = addTodo('Buy milk');
    const updated = toggleTodo(todo.id);
    expect(updated.completed).toBe(true);
  });

  it('should toggle a todo from completed back to incomplete', () => {
    const todo = addTodo('Buy milk');
    toggleTodo(todo.id);
    const updated = toggleTodo(todo.id);
    expect(updated.completed).toBe(false);
  });

  it('should return the updated todo', () => {
    const todo = addTodo('Buy milk');
    const updated = toggleTodo(todo.id);
    expect(updated).toBeDefined();
    expect(updated.id).toBe(todo.id);
    expect(updated.text).toBe(todo.text);
    expect(updated.completed).toBe(true);
  });

  it('should return undefined for a non-existent id', () => {
    const result = toggleTodo(999999);
    expect(result).toBeUndefined();
  });

  it('should not affect other todos when toggling one', () => {
    const todo1 = addTodo('First');
    const todo2 = addTodo('Second');
    toggleTodo(todo1.id);
    expect(todo2.completed).toBe(false);
  });
});
