import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// Extract the <style> and <script> blocks for scoped assertions.
const styleBlock = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
const scriptBlock = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';

/** The <script> block must be byte-identical to the one at HEAD (CSS-only change). */
function headScriptBlock() {
  const headHtml = execFileSync('git', ['show', 'HEAD:index.html'], {
    encoding: 'utf8',
    cwd: new URL('..', import.meta.url).pathname,
  });
  return headHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
}

function containsStyleRule(rule) {
  return styleBlock.includes(rule);
}

describe('issue #29 — modern design in raw CSS', () => {
  it('keeps the <script> block byte-identical to HEAD', () => {
    assert.equal(scriptBlock, headScriptBlock());
  });

  it('keeps all JS hooks intact (ids in markup, classes assigned by the script)', () => {
    for (const hook of [
      'id="todo-form"',
      'id="todo-input"',
      'id="add-btn"',
      'id="todo-list"',
    ]) {
      assert.ok(html.includes(hook), `missing markup hook: ${hook}`);
    }
    for (const hook of [
      "li.className = 'todo-item'",
      "li.classList.add('completed')",
      "checkbox.className = 'todo-checkbox'",
      "span.className = 'todo-text'",
      "deleteBtn.className = 'delete-btn'",
    ]) {
      assert.ok(scriptBlock.includes(hook), `missing script hook: ${hook}`);
    }
    // The script mixes single- and double-quoted string literals, so check both.
    for (const id of ['todo-list', 'todo-input', 'todo-form']) {
      const found =
        scriptBlock.includes(`getElementById('${id}')`) ||
        scriptBlock.includes(`getElementById("${id}")`);
      assert.ok(found, `missing script hook: getElementById(${id})`);
    }
  });

  it('is raw CSS only (no external stylesheets, fonts, or preprocessors)', () => {
    assert.ok(!/<link[^>]+stylesheet/i.test(html), 'no <link rel=stylesheet>');
    assert.ok(!/@import/.test(styleBlock), 'no @import');
    assert.ok(!/url\(/i.test(styleBlock), 'no url() resources');
  });

  it('defines design tokens on :root (colors, radii, shadows, spacing)', () => {
    assert.ok(containsStyleRule(':root'), ':root block exists');
    for (const token of [
      '--color-bg',
      '--color-surface',
      '--color-text',
      '--color-text-muted',
      '--color-accent',
      '--radius-card',
      '--shadow-card',
    ]) {
      assert.ok(styleBlock.includes(token), `missing token: ${token}`);
    }
  });

  it('supports automatic dark mode via prefers-color-scheme', () => {
    assert.ok(
      containsStyleRule('@media (prefers-color-scheme: dark)'),
      'dark-mode media query',
    );
    assert.ok(/color-scheme:\s*light\s+dark/.test(styleBlock), 'color-scheme declared');
  });

  it('uses a card surface (app-card) with radius and layered shadow', () => {
    assert.ok(html.includes('app-card'), 'app-card in markup');
    assert.ok(containsStyleRule('.app-card'), '.app-card rule');
    assert.ok(/border-radius/.test(styleBlock), 'border radius used');
    assert.ok(/box-shadow/.test(styleBlock), 'box shadow used');
    assert.ok(/linear-gradient/.test(styleBlock), 'gradient background');
  });

  it('styles an empty state with the :empty selector', () => {
    assert.ok(
      containsStyleRule('#todo-list:empty'),
      '#todo-list:empty rule',
    );
    assert.ok(/#todo-list:empty[^{]*::after/.test(styleBlock), 'empty-state ::after message');
  });

  it('adds micro-transitions and a reduced-motion guard', () => {
    assert.ok(/transition/.test(styleBlock), 'transitions present');
    assert.ok(
      containsStyleRule('@media (prefers-reduced-motion: reduce)'),
      'reduced-motion media query',
    );
  });

  it('provides visible focus styles via :focus-visible', () => {
    assert.ok(/:focus-visible/.test(styleBlock), ':focus-visible rule');
  });

  it('styles the accent button, checkbox, and completed state', () => {
    assert.ok(containsStyleRule('#add-btn'), 'button rule');
    assert.ok(/accent-color/.test(styleBlock), 'custom checkbox accent');
    assert.ok(/\.todo-item\.completed/.test(styleBlock), 'completed state rule');
  });
});