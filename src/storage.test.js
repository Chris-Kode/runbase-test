// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTodos, saveTodos } from './storage.js';

describe('loadTodos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns [] when localStorage is empty', () => {
    const result = loadTodos();
    expect(result).toEqual([]);
  });

  it('returns parsed array from localStorage', () => {
    const todos = [{ id: 1, text: 'Buy milk', completed: false }];
    localStorage.setItem('todos', JSON.stringify(todos));
    const result = loadTodos();
    expect(result).toEqual(todos);
  });

  it('returns [] for corrupt JSON', () => {
    localStorage.setItem('todos', 'not-json');
    const result = loadTodos();
    expect(result).toEqual([]);
  });

  it('returns [] if localStorage.getItem throws', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Access denied');
    });
    const result = loadTodos();
    expect(result).toEqual([]);
    vi.restoreAllMocks();
  });
});

describe('saveTodos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes JSON to localStorage', () => {
    const todos = [{ id: 1, text: 'Buy milk', completed: false }];
    saveTodos(todos);
    const stored = localStorage.getItem('todos');
    expect(JSON.parse(stored)).toEqual(todos);
  });

  it('handles localStorage.setItem throwing', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    expect(() => saveTodos([{ id: 1, text: 'Test', completed: false }])).not.toThrow();
    vi.restoreAllMocks();
  });

  it('round-trip preserves todo fields', () => {
    const todos = [
      { id: 1, text: 'Buy milk', completed: false },
      { id: 2, text: 'Walk dog', completed: true },
    ];
    saveTodos(todos);
    const loaded = loadTodos();
    expect(loaded).toEqual(todos);
  });
});