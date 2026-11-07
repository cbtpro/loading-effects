import { expect, test } from '@playwright/test';

test('card configuration, completion and rendering stay independent', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.effect-card')).toHaveCount(19);
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

test('all 19 presets render when their previews enter the viewport', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.effect-card');
  await expect(cards).toHaveCount(19);

  for (const card of await cards.all()) {
    await card.locator('.preview').scrollIntoViewIfNeeded();
    const renderer = await card.getAttribute('data-renderer');
    if (renderer === 'canvas') {
      await expect.poll(() => card.locator('canvas').evaluate(canvas => canvas.width)).toBeGreaterThan(0);
    } else if (await card.getAttribute('data-task-progress') !== null) {
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
