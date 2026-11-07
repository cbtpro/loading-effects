import { expect, test } from '@playwright/test';

test('right sidebar follows heading depth and highlights a range on the shared SVG rail', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 850 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: '动效分类' });
  const current = nav.locator('[aria-current="location"]');
  const rail = nav.locator('svg.toc-rail');
  const highlight = nav.locator('.toc-highlight');
  const indicator = highlight.locator('.toc-indicator');
  await expect(nav.getByRole('link')).toHaveCount(45);
  await expect(rail.locator('path')).toHaveAttribute('d', /^M1 .*L11 .*L1 /);
  await expect(highlight).toHaveCSS('mask-image', /data:image\/svg\+xml/);
  await expect(indicator).toHaveCSS('transition-property', 'margin-top, height');
  await expect(indicator).toHaveCSS('transition-duration', '0.15s, 0.15s');
  await expect(indicator).toHaveCSS('transition-timing-function', 'cubic-bezier(0.4, 0, 0.2, 1), cubic-bezier(0.4, 0, 0.2, 1)');
  const sidebar = await nav.boundingBox();
  const preview = await page.locator('#dot-matrix-wave').boundingBox();
  expect(sidebar.x).toBeGreaterThan(preview.x + preview.width);

  await nav.getByRole('link', { name: '粒子网络', exact: true }).click();
  await expect(page).toHaveURL(/#particle-network$/);
  await expect(current).toHaveText('粒子网络');
  await indicator.evaluate(node => {
    node.addEventListener('transitionrun', event => {
      if (event.propertyName === 'margin-top') node.dataset.moved = '';
    });
  });

  await page.locator('#geometry-effects').evaluate(section => {
    window.scrollBy(0, section.getBoundingClientRect().top - 40);
  });
  await expect(nav.getByRole('link', { name: '基础几何', exact: true })).toHaveAttribute('data-active', '');
  await expect.poll(() => nav.locator('[data-active]').count()).toBeGreaterThan(1);
  await expect(indicator).toHaveAttribute('data-moved', '');
  await expect.poll(() => indicator.evaluate(node => parseFloat(getComputedStyle(node).height))).toBeGreaterThan(32);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const lastEffect = page.locator('.effect-card h3').last();
  await expect(current).toHaveText(await lastEffect.textContent());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(indicator).toHaveCSS('transition-duration', '0s');
});

test('narrow view opens a directory and closes it after navigating', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#particle-network');
  const nav = page.getByRole('navigation', { name: '动效分类' });
  const toggle = nav.getByRole('button', { name: /本页目录/ });
  await expect(toggle).toContainText('粒子网络');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await nav.getByRole('link', { name: '基础几何', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toContainText('基础几何');
  const heading = await page.getByRole('heading', { name: '基础几何' }).boundingBox();
  const menu = await nav.boundingBox();
  expect(heading.y).toBeGreaterThan(menu.y + menu.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('TOC props can update an independent component and destroy it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 850 });
  await page.goto('/');
  await page.evaluate(async () => {
    const { mountToc } = await import('/src/toc.js');
    const host = document.createElement('div');
    document.body.append(host);
    window.demoToc = mountToc(host, {
      label: '自定义目录',
      items: [{ id: 'matrix-effects', title: '初始分类' }],
    });
  });
  const custom = page.getByRole('navigation', { name: '自定义目录' });
  await expect(custom.getByRole('link', { name: '初始分类' })).toBeAttached();
  await page.evaluate(() => {
    window.demoToc.update({
      label: '更新后的目录',
      accentColor: '#7c3aed',
      trackColor: '#a3b2c3',
      duration: 300,
      rootMargin: '0px',
      items: [{
        id: 'particle-effects',
        title: '粒子',
        children: [{ id: 'particle-network', title: '网络' }],
      }],
    });
  });
  const updated = page.getByRole('navigation', { name: '更新后的目录' });
  await expect(updated.getByRole('link')).toHaveCount(2);
  await expect(updated.getByRole('link', { name: '网络' })).toHaveAttribute('href', '#particle-network');
  await expect(updated.locator('.toc-rail path')).toHaveAttribute('d', /L11 /);
  await expect(updated.locator('.toc-rail')).toHaveCSS('color', 'rgb(163, 178, 195)');
  await expect(updated.locator('.toc-indicator')).toHaveCSS('background-color', 'rgb(124, 58, 237)');
  await expect(updated.locator('.toc-indicator')).toHaveCSS('transition-duration', '0.3s, 0.3s');
  await page.evaluate(() => window.demoToc.destroy());
  await expect(updated).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: '动效分类' }).getByRole('link')).toHaveCount(45);
});

test('card configuration, completion and rendering stay independent', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.effect-card')).toHaveCount(38);
  await expect(page.locator('.code-example[open]')).toHaveCount(0);

  const wave = page.locator('#dot-matrix-wave');
  const radial = page.locator('#radial-ripple');
  await wave.getByText('参数与演示进度', { exact: true }).click();
  await wave.getByLabel('进度模式').selectOption('estimated');
  await wave.getByLabel('进度值', { exact: false }).fill('93');
  await expect(wave.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '预计 93%');
  await expect(radial.locator('.progress')).toHaveText('正在生成图片');

  await wave.getByLabel('间距（px）').fill('26');
  const example = wave.locator('.code-example');
  await example.getByText('查看代码', { exact: true }).click();
  const code = example.locator('code');
  await expect(code).toContainText('<script setup>');
  await expect(code).toContainText('"gap": 26');
  await example.getByRole('button', { name: 'TS', exact: true }).click();
  await expect(code).toContainText('<script setup lang="ts">');
  await example.getByRole('button', { name: 'React', exact: true }).click();
  await expect(code).toContainText('const options: LoadingOptions');
  await example.getByRole('button', { name: 'JS', exact: true }).click();
  await expect(code).not.toContainText('LoadingOptions');

  await wave.getByRole('button', { name: '模拟内容就绪' }).click();
  await expect(wave.locator('[data-part="ready"]')).toBeVisible();
  await expect(wave.locator('canvas')).toHaveCount(0);
  await expect(radial.locator('canvas')).toHaveCount(1);
});

test('scrolling freezes the wave and preserves phase, progress and manual pause', async ({ page }) => {
  await page.addInitScript(() => {
    window.waveDraws = 0;
    const clearRect = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.closest('#dot-matrix-wave')) {
        window.waveDraws++;
        if (window.captureNextWave) {
          window.captureNextWave = false;
          queueMicrotask(() => { window.resumedFrame = this.canvas.toDataURL(); });
        }
      }
      return clearRect.apply(this, args);
    };
  });
  await page.goto('/');

  const wave = page.locator('#dot-matrix-wave');
  const geometry = page.locator('#geometry-effects');
  const scroll = locator => locator.evaluate(element => element.scrollIntoView({ block: 'center' }));
  const draws = () => page.evaluate(() => window.waveDraws);
  const pixels = () => wave.locator('canvas').evaluate(canvas => canvas.toDataURL());
  await expect.poll(draws).toBeGreaterThan(2);
  await wave.getByText('参数与演示进度', { exact: true }).click();
  await wave.getByLabel('进度模式').selectOption('actual');
  await wave.getByLabel('进度值', { exact: false }).fill('93');

  await scroll(geometry.locator('.preview').first());
  await expect(wave.locator('.preview')).not.toBeInViewport();
  await page.waitForTimeout(100);
  const count = await draws();
  const frozen = await pixels();
  await page.waitForTimeout(120);
  expect(await draws()).toBe(count);

  await page.evaluate(() => { window.captureNextWave = true; });
  await scroll(wave.locator('.preview'));
  await expect.poll(() => page.evaluate(() => window.resumedFrame === undefined)).toBe(false);
  expect(await page.evaluate(() => window.resumedFrame) === frozen).toBe(true);
  await expect.poll(draws).toBeGreaterThan(count + 1);
  await expect(wave.getByRole('progressbar')).toHaveText('93%');

  await wave.getByRole('button', { name: '暂停', exact: true }).click();
  const paused = await pixels();
  await scroll(geometry.locator('.preview').first());
  await scroll(wave.locator('.preview'));
  await page.waitForTimeout(120);
  expect(await pixels() === paused).toBe(true);
  await expect(wave.getByRole('button', { name: '继续播放' })).toBeVisible();
});

test('unavailable Canvas falls back and keeps the progress semantics', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === '2d' ? null : getContext.call(this, type, ...args);
    };
  });
  await page.goto('/');
  const wave = page.locator('#dot-matrix-wave');
  await expect(wave.locator('.renderer')).toHaveText('静态备用图形');
  await expect(wave.locator('canvas')).toHaveCount(0);
  await wave.getByText('参数与演示进度', { exact: true }).click();
  await wave.getByLabel('进度模式').selectOption('estimated');
  await wave.getByLabel('进度值', { exact: false }).fill('93');
  await expect(wave.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '预计 93%');
});

test('copies the generated code to the system clipboard', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Clipboard permission override is exercised in Chromium.');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const example = page.locator('#circular-spinner .code-example');
  await example.getByText('查看代码', { exact: true }).click();
  const code = example.locator('code');
  await expect(code).toContainText('@loading-effects/renderer-css');
  await example.getByRole('button', { name: '复制代码' }).click();
  await expect(example.getByRole('status')).toHaveText('已复制');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await code.textContent());
});

test('reduced motion keeps the interactive preview static at a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const ripple = page.locator('#interactive-ripple');
  const trigger = ripple.getByRole('button', { name: '从中心触发涟漪' });
  await expect(trigger).toBeDisabled();
  const canvas = ripple.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  await expect.poll(() => canvas.evaluate(node => node.width)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const still = await canvas.evaluate(node => node.toDataURL());
  await page.waitForTimeout(100);
  expect(await canvas.evaluate(node => node.toDataURL()) === still).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(trigger).toBeEnabled();
  await trigger.click();
  await expect.poll(() => canvas.evaluate((node, stillFrame) => node.toDataURL() !== stillFrame, still)).toBe(true);
});

test('all 38 presets render when their previews enter the viewport', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.effect-card');
  await expect(cards).toHaveCount(38);

  for (const card of await cards.all()) {
    await card.locator('.preview').scrollIntoViewIfNeeded();
    const renderer = await card.getAttribute('data-renderer');
    if (renderer === 'canvas') {
      await expect.poll(() => card.locator('canvas').evaluate(canvas => canvas.width)).toBeGreaterThan(0);
    } else if (renderer === 'webgl') {
      await expect(card.locator('[data-part="renderer"]')).toHaveText(/WebGL 2|静态备用图形/);
      await expect(card.locator('.surface > :visible')).toHaveCount(1);
    } else if (await card.locator('xpath=ancestor::section[@id="text-effects"]').count()) {
      await expect(card.locator('.surface > div > span')).toBeVisible();
    } else if (await card.getAttribute('data-skeleton') !== null || await card.getAttribute('data-task-progress') !== null) {
      await expect.poll(() => card.locator('.surface > div > :first-child').evaluate(node => node.clientHeight)).toBeGreaterThan(0);
    } else {
      const shape = card.locator('.surface > div > div').first();
      await expect.poll(() => shape.evaluate(node => node.style.transform)).not.toBe('');
    }
  }
});

test('progress presets use task values and wait for explicit completion', async ({ page }) => {
  await page.goto('/');
  const ring = page.locator('#circular-progress');
  const bar = page.locator('#gradient-progress');
  const arc = ring.locator('circle').last();
  const fill = bar.locator('.surface > div > div > div');
  for (const card of [ring, bar]) {
    await card.getByText('参数与演示进度', { exact: true }).click();
    await expect(card.getByRole('progressbar')).toHaveCount(0);
    await expect(card.getByLabel('进度值', { exact: false })).toBeDisabled();
    await card.getByLabel('进度模式').selectOption('actual');
    await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  }
  await arc.scrollIntoViewIfNeeded();
  await expect.poll(() => arc.evaluate(node => parseFloat(node.style.strokeDashoffset))).toBe(100);
  await bar.locator('.preview').scrollIntoViewIfNeeded();
  await expect.poll(() => fill.evaluate(node => node.style.width)).toBe('0%');

  for (const card of [ring, bar]) {
    await card.getByLabel('进度模式').selectOption('estimated');
    await card.getByLabel('进度值', { exact: false }).fill('93');
    await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '预计 93%');
  }
  await arc.scrollIntoViewIfNeeded();
  await expect.poll(() => arc.evaluate(node => parseFloat(node.style.strokeDashoffset))).toBe(7);
  await expect(ring.locator('.surface span')).toHaveText('预计 93%');
  await bar.locator('.preview').scrollIntoViewIfNeeded();
  await expect.poll(() => fill.evaluate(node => node.style.width)).toBe('93%');
  await expect(fill.locator('div')).toBeVisible();

  await bar.getByLabel('进度值', { exact: false }).fill('100');
  await expect(bar.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await expect(bar.locator('[data-part="ready"]')).toBeHidden();
  await bar.getByRole('button', { name: '模拟内容就绪' }).click();
  await expect(bar.locator('[data-part="ready"]')).toBeVisible();
  await expect(fill).toHaveCount(0);
});

test('segmented, step and wave previews follow their task inputs', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const segments = page.locator('#segmented-progress');
  const step = page.locator('#step-progress');
  const wave = page.locator('#wave-progress');
  for (const card of [segments, step, wave]) {
    await card.getByText('参数与演示进度', { exact: true }).click();
  }

  await segments.getByLabel('进度模式').selectOption('actual');
  await segments.getByLabel('进度值', { exact: false }).fill('93');
  await segments.locator('.preview').scrollIntoViewIfNeeded();
  const last = segments.locator('.surface > div > div > div > div').last();
  await expect.poll(() => last.evaluate(node => parseFloat(node.style.width))).toBeCloseTo(30);
  await segments.getByLabel('允许部分填充').uncheck();
  await segments.locator('.preview').scrollIntoViewIfNeeded();
  await expect.poll(() => last.evaluate(node => node.style.width)).toBe('0%');

  await step.getByLabel('当前阶段（从 0 开始）').fill('1');
  await step.locator('.preview').scrollIntoViewIfNeeded();
  await expect(step.locator('[data-state="completed"]')).toContainText('准备');
  await expect(step.locator('[data-state="current"]')).toContainText('处理');
  await expect(step.locator('[data-state="pending"]')).toContainText('完成');
  await expect(step.locator('[data-part="status"]')).toHaveText(/当前阶段 处理/);
  await expect(step.getByRole('progressbar')).toHaveCount(0);

  await wave.getByLabel('进度模式').selectOption('actual');
  const canvas = wave.locator('canvas');
  const alpha = () => canvas.evaluate(node => {
    const x = Math.round(node.width / 2 - 60);
    return node.getContext('2d').getImageData(x, Math.floor(node.height / 2), 1, 1).data[3];
  });
  await wave.locator('.preview').scrollIntoViewIfNeeded();
  await expect.poll(alpha).toBeLessThan(50);
  await wave.getByLabel('进度值', { exact: false }).fill('100');
  await wave.locator('.preview').scrollIntoViewIfNeeded();
  await expect.poll(alpha).toBe(255);
  await expect(wave.locator('[data-part="ready"]')).toBeHidden();
});

test('particle motion responds to pause and resumes without remounting', async ({ page }) => {
  await page.goto('/');
  const orbit = page.locator('#particle-orbit');
  const canvas = orbit.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  const pixels = () => canvas.evaluate(node => node.toDataURL());
  await expect.poll(() => canvas.evaluate(node => node.width)).toBeGreaterThan(0);
  const first = await pixels();
  await expect.poll(async () => await pixels() === first).toBe(false);
  await orbit.getByRole('button', { name: '暂停', exact: true }).click();
  const frozen = await pixels();
  await page.waitForTimeout(100);
  expect(await pixels() === frozen).toBe(true);
  await orbit.getByRole('button', { name: '继续播放' }).click();
  await expect.poll(async () => await pixels() === frozen).toBe(false);
});

test('progressive reveal replaces individual text regions without resizing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const reveal = page.locator('#progressive-reveal');
  await reveal.getByText('参数与演示进度', { exact: true }).click();
  await reveal.getByLabel('布局', { exact: true }).selectOption('article-card');
  await reveal.locator('.preview').scrollIntoViewIfNeeded();
  const title = reveal.locator('[data-region="title"]');
  const body = reveal.locator('[data-region="body"]');
  const footer = reveal.locator('[data-region="footer"]');
  const before = await title.boundingBox();
  await reveal.getByRole('checkbox', { name: '标题', exact: true }).check();
  await reveal.locator('.preview').scrollIntoViewIfNeeded();
  await expect(title).toHaveAttribute('data-ready', 'true');
  await expect(body).toHaveAttribute('data-ready', 'false');
  await expect(footer).toHaveAttribute('data-ready', 'false');
  await expect(title.getByText('加载动效示例')).toBeVisible();
  const after = await title.boundingBox();
  expect([after.width, after.height]).toEqual([before.width, before.height]);
  await reveal.getByText('查看代码', { exact: true }).click();
  await expect(reveal.locator('code')).toContainText('"readyKeys": [');
  await expect(reveal.locator('code')).toContainText('各区域随任务结果独立显示');
  await reveal.getByRole('button', { name: '恢复默认' }).click();
  await expect(reveal.getByRole('checkbox', { name: '标题', exact: true })).not.toBeChecked();
  await reveal.locator('.preview').scrollIntoViewIfNeeded();
  await expect(title).toHaveAttribute('data-ready', 'false');
});

test('Web Components snippets use the custom element API in JS and TS', async ({ page }) => {
  await page.goto('/');
  const example = page.locator('#interactive-ripple .code-example');
  await example.getByText('查看代码', { exact: true }).click();
  await example.getByRole('button', { name: 'Web Components', exact: true }).click();
  await expect(example.locator('code')).toContainText("document.createElement('loading-effect')");
  await expect(example.locator('code')).toContainText('element.trigger([0.5, 0.5])');
  await expect(example.locator('.code-filename')).toHaveText('LoadingExample.js');
  await example.getByRole('button', { name: 'TS', exact: true }).click();
  await expect(example.locator('code')).toContainText('const options: LoadingOptions');
  await expect(example.locator('.code-filename')).toHaveText('LoadingExample.ts');
});

test('text effects keep graphemes intact and remain readable with reduced motion', async ({ page }) => {
  await page.goto('/');
  const typing = page.locator('#typing-dots');
  const line = typing.locator('.surface > div > span');
  await line.scrollIntoViewIfNeeded();
  const dots = line.locator('span');
  const visibleDots = () => dots.evaluateAll(nodes => nodes.filter(node => node.style.visibility === 'visible').length);
  const first = await visibleDots();
  await expect.poll(visibleDots).not.toBe(first);
  const width = (await line.boundingBox()).width;
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(visibleDots).toBe(3);
  expect((await line.boundingBox()).width).toBe(width);

  const wave = page.locator('#character-wave');
  await wave.getByText('参数与演示进度', { exact: true }).click();
  const input = wave.getByLabel('文字', { exact: true });
  await input.fill('A👩🏽‍💻é');
  await wave.locator('.preview').scrollIntoViewIfNeeded();
  const glyphs = wave.locator('.surface > div > span > span');
  await expect(glyphs).toHaveText(['A', '👩🏽‍💻', 'é']);

  const scramble = page.locator('#scramble-text');
  await scramble.getByText('参数与演示进度', { exact: true }).click();
  await scramble.getByLabel('文字', { exact: true }).fill('完成✅');
  await scramble.locator('.preview').scrollIntoViewIfNeeded();
  await expect(scramble.locator('.surface > div > span > span > span:last-child')).toHaveText(['完', '成', '✅']);
});

test('liquid fill clips to its selected shape and preserves real progress', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const card = page.locator('#liquid-fill');
  await expect(card.locator('.settings')).toHaveAttribute('open', '');
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '63');
  await card.getByLabel('显示数值', { exact: true }).uncheck();
  await card.getByLabel('进度模式').selectOption('actual');
  await card.getByLabel('进度值', { exact: false }).fill('0');
  const canvas = card.locator('canvas');
  const alpha = (corner = false) => canvas.evaluate((node, corner) => {
    const size = Math.min(node.clientWidth * .8, node.clientHeight * .76, 132);
    const offset = corner ? size * .4 : 0;
    const x = Math.floor((node.clientWidth / 2 - offset) * node.width / node.clientWidth);
    const y = Math.floor((node.clientHeight / 2 - offset) * node.height / node.clientHeight);
    return node.getContext('2d').getImageData(x, y, 1, 1).data[3];
  }, corner);
  await card.locator('.preview').scrollIntoViewIfNeeded();
  await expect.poll(() => alpha()).toBeLessThan(50);
  await card.getByLabel('进度值', { exact: false }).fill('100');
  await card.locator('.preview').scrollIntoViewIfNeeded();
  await expect.poll(() => alpha()).toBe(255);
  expect(await alpha(true)).toBe(0);
  await card.getByLabel('容器形状').selectOption('rounded-square');
  await card.locator('.preview').scrollIntoViewIfNeeded();
  await expect.poll(() => alpha(true)).toBe(255);
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await expect(card.locator('[data-part="ready"]')).toBeHidden();
});

test('WebGL fluid demos fall back cleanly without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === 'webgl2' ? null : original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  for (const id of ['metaball', 'fluid-ribbon', 'ink-diffusion']) {
    const card = page.locator('#' + id);
    await expect(card.locator('[data-part="renderer"]')).toHaveText('静态备用图形');
    await expect(card.locator('canvas')).toBeHidden();
    await expect(card.locator('.surface > div')).toBeVisible();
    expect(await card.locator('.surface > div').evaluate(node => getComputedStyle(node).backgroundImage)).not.toBe('none');
  }
});

test('WebGL fluid shaders draw pixels and recover from context loss', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium uses a pinned software WebGL renderer for pixel checks.');
  await page.addInitScript(() => {
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      draw.apply(this, args);
      const id = this.canvas.closest('article')?.id;
      if (id !== window.captureWebGL) return;
      window.captureWebGL = null;
      const { drawingBufferWidth: width, drawingBufferHeight: height } = this;
      const pixels = new Uint8Array(width * height * 4);
      this.readPixels(0, 0, width, height, this.RGBA, this.UNSIGNED_BYTE, pixels);
      let count = 0;
      let hash = 0;
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index]) count++;
        hash = (Math.imul(hash, 31) + pixels[index]) >>> 0;
      }
      window.webGLSample = { count, hash };
    };
  });
  await page.goto('/');

  const capture = async id => {
    const card = page.locator('#' + id);
    await expect(card.locator('[data-part="renderer"]')).toHaveText('WebGL 2');
    await card.locator('.preview').scrollIntoViewIfNeeded();
    await page.evaluate(id => {
      window.webGLSample = null;
      window.captureWebGL = id;
    }, id);
    await page.waitForFunction(() => window.webGLSample);
    return page.evaluate(() => window.webGLSample);
  };

  for (const id of ['metaball', 'fluid-ribbon', 'ink-diffusion']) {
    const initial = await capture(id);
    expect(initial.count).toBeGreaterThan(50);
    await page.waitForTimeout(140);
    expect((await capture(id)).hash).not.toBe(initial.hash);
  }

  const card = page.locator('#ink-diffusion');
  const canvas = card.locator('canvas');
  await card.locator('.surface').hover({ position: { x: 12, y: 12 } });
  await expect.poll(() => canvas.evaluate(node => {
    const gl = node.getContext('webgl2');
    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    return gl.getUniform(program, gl.getUniformLocation(program, 'uPointer'))[2];
  })).toBeGreaterThan(.4);
  await canvas.evaluate(node => {
    const extension = node.getContext('webgl2').getExtension('WEBGL_lose_context');
    node.addEventListener('webglcontextlost', () => setTimeout(() => extension.restoreContext(), 800), { once: true });
    extension.loseContext();
  });
  await expect(canvas).toBeHidden();
  await expect(card.locator('[data-part="renderer"]')).toHaveText('静态备用图形');
  await expect(card.locator('.surface > div')).toBeVisible();
  await expect(canvas).toBeVisible();
  expect((await capture('ink-diffusion')).count).toBeGreaterThan(50);
});

test('liquid fill layers waves only while the task progress is known and motion is enabled', async ({ page }) => {
  await page.addInitScript(() => {
    const prototype = CanvasRenderingContext2D.prototype;
    const clear = prototype.clearRect;
    const fill = prototype.fill;
    prototype.clearRect = function (...args) {
      if (this.canvas.closest('#liquid-fill')) window.liquidPaints = [];
      return clear.apply(this, args);
    };
    prototype.fill = function (...args) {
      if (this.canvas.closest('#liquid-fill')) window.liquidPaints?.push(this.fillStyle);
      return fill.apply(this, args);
    };
  });
  await page.goto('/');
  const card = page.locator('#liquid-fill');
  await expect(card.locator('.settings')).toHaveAttribute('open', '');
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '63');
  await card.getByLabel('显示数值', { exact: true }).uncheck();
  await card.getByLabel('进度模式').selectOption('estimated');
  await card.getByLabel('进度值', { exact: false }).fill('63');
  await card.locator('.preview').scrollIntoViewIfNeeded();
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '预计 63%');
  const paints = () => page.evaluate(() => window.liquidPaints);
  await expect.poll(paints).toEqual(['#74a7fa', '#2359be']);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(paints).toEqual(['#2359be']);
  await card.getByLabel('进度模式').selectOption('unknown');
  await card.locator('.preview').scrollIntoViewIfNeeded();
  await expect(card.getByRole('progressbar')).toHaveCount(0);
  await expect.poll(paints).toEqual(['#2359be', '#2359be', '#2359be']);
});

test('liquid fill opens with visible progress even without Canvas 2D', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === '2d' ? null : original.call(this, type, ...args);
    };
  });
  await page.goto('/#liquid-fill');
  const card = page.locator('#liquid-fill');
  await expect(card.locator('[data-part="renderer"]')).toHaveText('静态备用图形');
  await expect(card.getByLabel('进度值', { exact: false })).toHaveValue('63');
  const fill = card.locator('.surface > div > div > div');
  await expect.poll(() => fill.evaluate(node => node.style.height)).toBe('63%');
  await card.getByLabel('进度值', { exact: false }).fill('80');
  await expect.poll(() => fill.evaluate(node => node.style.height)).toBe('80%');
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80');
  await card.getByRole('button', { name: '恢复默认' }).click();
  await expect.poll(() => fill.evaluate(node => node.style.height)).toBe('63%');
});

test('nearby network particles move toward the mouse and distant particles stay in place', async ({ page }) => {
  await page.addInitScript(() => {
    const prototype = CanvasRenderingContext2D.prototype;
    const clear = prototype.clearRect;
    const arc = prototype.arc;
    prototype.clearRect = function (...args) {
      if (this.canvas.closest('#particle-network')) window.networkPoints = [];
      return clear.apply(this, args);
    };
    prototype.arc = function (x, y, ...args) {
      if (this.canvas.closest('#particle-network')) window.networkPoints?.push([x, y]);
      return arc.call(this, x, y, ...args);
    };
  });
  await page.goto('/');
  const network = page.locator('#particle-network');
  const surface = network.locator('.surface');
  await network.getByText('参数与演示进度', { exact: true }).click();
  await network.getByLabel('漂移速度（px/s）').fill('0');
  await surface.scrollIntoViewIfNeeded();
  const points = () => page.evaluate(() => window.networkPoints);
  await expect.poll(async () => (await points())?.length).toBe(64);
  const baseline = await points();
  const {width, height} = await surface.boundingBox();
  const near = baseline.findIndex(([x, y]) => x > 40 && x < width - 70 && y > 40 && y < height - 40);
  expect(near).toBeGreaterThanOrEqual(0);
  const target = { x: Math.round(baseline[near][0] + 35), y: Math.round(baseline[near][1]) };
  const distance = ([x, y]) => Math.hypot(target.x - x, target.y - y);
  const far = baseline.findIndex(point => distance(point) > 160);
  expect(far).toBeGreaterThanOrEqual(0);
  await surface.hover({ position: target });
  await expect.poll(async () => distance((await points())[near])).toBeLessThan(distance(baseline[near]) - 10);
  expect((await points())[far]).toEqual(baseline[far]);
  await network.getByRole('checkbox', { name: '响应鼠标' }).uncheck();
  await surface.hover({ position: target });
  await expect.poll(points).toEqual(baseline);
});

test('hover highlights a nearby stage without changing the selected step', async ({ page }) => {
  await page.goto('/');
  const stage = page.locator('#step-progress');
  const surface = stage.locator('.surface');
  const first = stage.locator('li span').first();
  await surface.scrollIntoViewIfNeeded();
  await surface.hover({ position: { x: 12, y: 12 } });
  await expect.poll(() => first.evaluate(node => node.style.boxShadow)).not.toBe('');
  await expect(stage.locator('li[data-state="current"]')).toHaveCount(1);
  await stage.getByText('参数与演示进度', { exact: true }).hover();
  await expect.poll(() => first.evaluate(node => node.style.boxShadow)).toBe('');
});

test('segmented progress highlights only the hovered segment without changing its fill', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('#segmented-progress');
  await card.getByText('参数与演示进度', { exact: true }).click();
  await card.getByLabel('进度模式').selectOption('actual');
  await card.getByLabel('进度值', { exact: false }).fill('93');
  const segments = card.locator('.surface > div > div > div');
  const last = segments.last();
  await last.hover({ force: true });
  const highlighted = () => segments.evaluateAll(nodes => nodes.map(node => Boolean(node.style.boxShadow)));
  await expect.poll(highlighted).toEqual([...Array(9).fill(false), true]);
  await expect.poll(() => last.locator('div').evaluate(node => parseFloat(node.style.width))).toBeCloseTo(30);
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '93');
  await segments.first().hover({ force: true });
  await expect.poll(highlighted).toEqual([true, ...Array(9).fill(false)]);
  await card.getByText('参数与演示进度', { exact: true }).hover();
  await expect.poll(highlighted).toEqual(Array(10).fill(false));
});
