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

/**
 * Return the body of the first block whose prelude contains `needle`, using
 * brace matching so nested rules do not truncate the result.
 */
function extractBlock(css, needle) {
  const start = css.indexOf(needle);
  if (start === -1) return '';
  const open = css.indexOf('{', start);
  if (open === -1) return '';
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return '';
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

  it('keeps the dark-mode body background reachable in the cascade', () => {
    const darkMedia = extractBlock(styleBlock, '@media (prefers-color-scheme: dark)');
    const darkBody = darkMedia.match(/\bbody\s*\{([^}]*)\}/)?.[1] ?? '';
    assert.match(darkBody, /background\s*:/, 'dark body rule declares a background');
    const baseBody = styleBlock.search(/(^|\s)body\s*\{/);
    const darkMediaIndex = styleBlock.indexOf('@media (prefers-color-scheme: dark)');
    assert.ok(
      darkMediaIndex > baseBody,
      'dark body override must come after the base body rule to win the cascade',
    );
  });

  it('provides an explicit non-blur fallback for backdrop-filter', () => {
    const fallback = extractBlock(styleBlock, '@supports not');
    assert.match(fallback, /\.app-card/, 'fallback targets .app-card');
    assert.match(fallback, /background\s*:/, 'fallback sets an opaque background');
  });

  it('gives the todo input a translucent field', () => {
    assert.match(
      styleBlock,
      /--color-field:\s*rgb\([^;]*\/\s*0?\.\d+\)/,
      'translucent --color-field token',
    );
    const input = styleBlock.match(/#todo-input\s*\{([^}]*)\}/)?.[1] ?? '';
    assert.match(input, /background:\s*var\(--color-field\)/, '#todo-input uses the field token');
  });

  it('actually uses the neon lime token, not just defines it', () => {
    const occurrences = styleBlock.match(/--neon-lime/g)?.length ?? 0;
    assert.ok(
      occurrences >= 2,
      `--neon-lime should be defined and consumed, found ${occurrences} occurrences`,
    );
  });

  it('avoids background-attachment: fixed to prevent mobile scroll jank', () => {
    assert.ok(
      !/background-attachment\s*:\s*fixed/.test(styleBlock),
      'no background-attachment: fixed',
    );
  });
});

describe('issue #33 — professional motion system', () => {
  it('defines motion tokens on :root (easing, durations, stagger)', () => {
    for (const token of [
      '--ease-out',
      '--ease-spring',
      '--ease-in-out',
      '--dur-fast',
      '--dur-base',
      '--dur-slow',
      '--dur-reveal',
      '--stagger',
    ]) {
      assert.ok(styleBlock.includes(token), `missing motion token: ${token}`);
    }
  });

  it('defines the core motion keyframes', () => {
    for (const name of ['card-enter', 'row-enter', 'row-leave', 'check-pop']) {
      assert.ok(
        new RegExp(`@keyframes\\s+${name}\\b`).test(styleBlock),
        `missing @keyframes ${name}`,
      );
    }
  });

  it('gates row entrance and exit with the is-entering / is-leaving classes', () => {
    const entering =
      styleBlock.match(/\.todo-item\.is-entering\s*\{([^}]*)\}/)?.[1] ?? '';
    assert.match(entering, /row-enter/, '.is-entering uses row-enter');
    const leaving =
      styleBlock.match(/\.todo-item\.is-leaving\s*\{([^}]*)\}/)?.[1] ?? '';
    assert.match(leaving, /row-leave/, '.is-leaving uses row-leave');
    assert.match(
      leaving,
      /pointer-events:\s*none/,
      '.is-leaving disables pointer events',
    );
  });

  it('wires the script to the entrance/exit hooks', () => {
    for (const hook of [
      'is-entering',
      'is-leaving',
      'animationend',
      'prefers-reduced-motion',
    ]) {
      assert.ok(scriptBlock.includes(hook), `missing script hook: ${hook}`);
    }
    assert.match(
      scriptBlock,
      /function\s+renderTodos\s*\([^)]*entering/,
      'renderTodos accepts an entering set',
    );
  });

  it('pops the checkbox and sweeps the completed strikethrough', () => {
    assert.match(styleBlock, /\.todo-checkbox:checked\s*\{[^}]*check-pop/);
    const doneText =
      styleBlock.match(/(^|\})\s*\.todo-text\s*\{([^}]*)\}/)?.[2] ?? '';
    assert.match(doneText, /linear-gradient/, 'sweep is a gradient underline');
    assert.match(doneText, /background-size:\s*0%/, 'sweep starts collapsed');
    const completed =
      styleBlock.match(/\.todo-item\.completed\s+\.todo-text\s*\{([^}]*)\}/)?.[1] ?? '';
    assert.match(completed, /background-size:\s*100%/, 'completed sweep reaches 100%');
  });

  it('reveals the card, header, form, and empty state on load', () => {
    assert.match(styleBlock, /\.app-card\s*\{[^}]*card-enter/);
    const header = styleBlock.match(/(^|\})\s*header\s*\{([^}]*)\}/)?.[2] ?? '';
    assert.match(header, /card-enter/);
    assert.match(styleBlock, /#todo-form\s*\{[^}]*card-enter/);
    assert.match(styleBlock, /#todo-list:empty::after\s*\{[^}]*empty-enter/);
  });

  it('drifts a fixed, non-interactive aurora background layer', () => {
    const aurora = styleBlock.match(/\n\s*body::before\s*\{([^}]*)\}/)?.[1] ?? '';
    assert.match(aurora, /position:\s*fixed/, 'aurora is fixed');
    assert.match(aurora, /pointer-events:\s*none/, 'aurora ignores pointer events');
    assert.match(aurora, /aurora-drift/, 'aurora drifts');
  });

  it('keeps looping animations compositor-friendly (no layout properties)', () => {
    const keyframeNames = [...styleBlock.matchAll(/@keyframes\s+([\w-]+)/g)].map(
      (m) => m[1],
    );
    const looping = new Set();
    for (const decl of styleBlock.match(/animation:[^;]+;/g) ?? []) {
      if (!/infinite/.test(decl)) continue;
      for (const name of keyframeNames) {
        if (new RegExp(`(^|[\\s,])${name}([\\s,;]|$)`).test(decl)) {
          looping.add(name);
        }
      }
    }
    assert.ok(looping.size > 0, 'at least one looping animation is declared');
    const layoutProp =
      /(?:^|[;{\s])(?:width|height|top|right|bottom|left|margin|padding)(?:-[\w-]+)?\s*:/;
    for (const name of looping) {
      const body = extractBlock(styleBlock, `@keyframes ${name}`);
      assert.ok(body.length > 0, `could not read @keyframes ${name}`);
      assert.ok(
        !layoutProp.test(body),
        `${name} animates a layout property while looping`,
      );
    }
  });

  it('collapses all motion under prefers-reduced-motion', () => {
    const reduced = extractBlock(
      styleBlock,
      '@media (prefers-reduced-motion: reduce)',
    );
    assert.match(reduced, /animation:\s*none\s*!important/, 'animation is zeroed');
    assert.match(reduced, /transition:\s*none\s*!important/, 'transition is zeroed');
  });

  it('still avoids background-attachment: fixed', () => {
    assert.ok(!/background-attachment\s*:\s*fixed/.test(styleBlock));
  });

  // --- regressions requested in the PR #34 review ---

  it('ignores bubbled animationend events from descendant animations (F1)', () => {
    // `animationend` bubbles: a child check-pop/glow must never be mistaken
    // for this element's row-enter/row-glow/row-leave.
    const sourceGuards = scriptBlock.match(/event\.target\s*!==\s*li/g) ?? [];
    assert.ok(
      sourceGuards.length >= 3,
      `expected a source guard on each animationend handler, found ${sourceGuards.length}`,
    );
    for (const name of ['row-enter', 'row-glow', 'row-leave']) {
      assert.match(
        scriptBlock,
        new RegExp(`event\\.animationName\\s*!==\\s*['"]${name}['"]`),
        `missing animationName guard for ${name}`,
      );
    }
  });

  it('lets row-leave win the cascade over a concurrent row-glow (F3)', () => {
    const glowIndex = styleBlock.indexOf('.todo-item.just-toggled');
    const leaveIndex = styleBlock.indexOf('.todo-item.is-leaving');
    assert.ok(glowIndex !== -1, '.just-toggled rule exists');
    assert.ok(leaveIndex !== -1, '.is-leaving rule exists');
    assert.ok(
      leaveIndex > glowIndex,
      '.is-leaving must be declared after .just-toggled to override it',
    );
  });

  it('replaces the static line-through with the sweep instead of stacking (F2)', () => {
    const completed =
      styleBlock.match(/\.todo-item\.completed\s+\.todo-text\s*\{([^}]*)\}/)?.[1] ?? '';
    assert.doesNotMatch(
      completed,
      /text-decoration[^;]*line-through/,
      'completed text must not draw a line-through next to the sweep',
    );
    const reduced = extractBlock(
      styleBlock,
      '@media (prefers-reduced-motion: reduce)',
    );
    assert.match(
      reduced,
      /text-decoration:\s*line-through/,
      'reduced motion keeps line-through as the sweep fallback',
    );
  });
});
