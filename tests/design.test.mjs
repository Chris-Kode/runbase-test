import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// Extract the <style> and <script> blocks for scoped assertions.
const styleBlock = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
const scriptBlock = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';

/**
 * The <script> block must stay byte-identical to the one captured in
 * tests/script-block.snapshot.js (the redesign is CSS/markup-only).
 * The snapshot keeps this test working in git-less CI checkouts; if the
 * snapshot file is absent, fall back to the block at HEAD.
 */
function referenceScriptBlock() {
  try {
    return readFileSync(
      new URL('./script-block.snapshot.js', import.meta.url),
      'utf8',
    );
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    const headHtml = execFileSync('git', ['show', 'HEAD:index.html'], {
      encoding: 'utf8',
      cwd: new URL('..', import.meta.url).pathname,
    });
    return headHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
  }
}

function containsStyleRule(rule) {
  return styleBlock.includes(rule);
}

describe('issue #29 — modern design in raw CSS', () => {
  it('keeps the <script> block byte-identical to the snapshot', () => {
    assert.equal(scriptBlock, referenceScriptBlock());
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

describe('issue #31 — neon design', () => {
  it('defines a neon palette and glow tokens on :root', () => {
    for (const token of ['--neon-cyan', '--neon-magenta']) {
      assert.ok(styleBlock.includes(token), `missing neon token: ${token}`);
    }
    assert.ok(
      /--neon-glow-[\w-]+\s*:/.test(styleBlock),
      'at least one --neon-glow-* token',
    );
  });

  it('uses layered neon glow shadows (0 0 offsets)', () => {
    assert.ok(
      /box-shadow:\s*[^;]*0 0/.test(styleBlock),
      'box-shadow with 0 0 glow offset',
    );
    const card = styleBlock.match(/\.app-card\s*\{([^}]*)\}/)?.[1] ?? '';
    assert.ok(card.includes('box-shadow'), '.app-card declares box-shadow');
    assert.ok(
      /box-shadow:[^;]*,/.test(card),
      '.app-card box-shadow has multiple layers',
    );
  });

  it('renders the title as neon gradient text', () => {
    assert.ok(
      /background-clip:\s*text/.test(styleBlock),
      'background-clip: text',
    );
    const h1 = styleBlock.match(/(^|\})\s*h1\s*\{([^}]*)\}/)?.[2] ?? '';
    assert.ok(/linear-gradient/.test(h1), 'h1 uses a linear-gradient');
  });

  it('paints a neon grid background without image assets', () => {
    assert.ok(
      /repeating-linear-gradient/.test(styleBlock),
      'repeating-linear-gradient grid',
    );
  });

  it('adds keyframes while keeping the reduced-motion guard', () => {
    assert.ok(/@keyframes\s+[\w-]+/.test(styleBlock), '@keyframes present');
    assert.ok(
      containsStyleRule('@media (prefers-reduced-motion: reduce)'),
      'reduced-motion media query retained',
    );
  });

  it('styles neon danger and completed states', () => {
    assert.ok(styleBlock.includes('text-decoration-color'), 'neon strikethrough color');
    assert.ok(
      /\.delete-btn:hover\s*\{[^}]*--color-danger/.test(styleBlock) ||
        /\.delete-btn:hover\s*\{[^}]*--neon-danger/.test(styleBlock),
      'delete button uses a neon danger token on hover',
    );
  });

  it('keeps completed text legible (opacity >= 0.85)', () => {
    const completed =
      styleBlock.match(/\.todo-item\.completed[^{]*\{([^}]*)\}/)?.[1] ?? '';
    const opacity = Number(completed.match(/opacity:\s*([\d.]+)/)?.[1]);
    assert.ok(
      Number.isFinite(opacity) && opacity >= 0.85,
      `completed opacity should be >= 0.85, got ${opacity}`,
    );
  });
});