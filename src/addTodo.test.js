import { describe, it, expect, beforeEach } from 'vitest';
import { addTodo, todos, clearTodos } from './addTodo.js';

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
