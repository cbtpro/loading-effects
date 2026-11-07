import { expect, test } from '@playwright/test';

test('React and Vue replace options, switch renderers and unmount cleanly', async ({ page }) => {
  await page.goto('http://127.0.0.1:4318/');
  for (const id of ['react', 'vue']) {
    const section = page.locator(`#${id}`);
    const host = section.getByRole('status');
    const rendered = host.locator(':scope > *');
    const button = name => section.getByRole('button', { name, exact: true });
    await expect(rendered).toHaveCount(1);

    if (id === 'vue') await button('切换动效').click();
    await expect(host.locator('canvas')).toHaveCount(0);
    const css = await rendered.elementHandle();
    const originalColor = await rendered.evaluate(node => node.style.color);
    await button('切换颜色').click();
    await expect(rendered).toHaveCSS('color', 'rgb(147, 51, 234)');
    expect(await css.evaluate(node => node.isConnected)).toBe(true);
    await button('切换颜色').click();
    await expect.poll(() => rendered.evaluate(node => node.style.color)).toBe(originalColor);

    await button('切换动效').click();
    await expect(host.locator('canvas')).toHaveCount(1);
    expect(await css.evaluate(node => node.isConnected)).toBe(false);
    const canvas = await host.locator('canvas').elementHandle();
    await button('卸载').click();
    await expect(host).toHaveCount(0);
    expect(await canvas.evaluate(node => node.isConnected)).toBe(false);
    await button('挂载').click();
    await expect(rendered).toHaveCount(1);
  }
});

test('Web Components reconnect without leaking the previous renderer', async ({ page }) => {
  await page.goto('http://127.0.0.1:4318/');
  const section = page.locator('#web-components');
  const element = section.locator('loading-effect');
  await expect(element).toHaveJSProperty('renderer', 'css');

  await section.getByRole('button', { name: '切换动效' }).click();
  await expect(element).toHaveJSProperty('renderer', 'canvas');
  await expect(element.locator('canvas')).toHaveCount(1);
  const original = await element.locator('canvas').elementHandle();
  const host = await element.elementHandle();
  await section.getByLabel('速度').fill('1.8');
  expect(await original.evaluate(node => node.isConnected)).toBe(true);

  await section.getByRole('button', { name: '卸载' }).click();
  expect(await host.evaluate(node => node.renderer)).toBeUndefined();
  expect(await original.evaluate(node => node.isConnected)).toBe(false);
  await section.getByRole('button', { name: '挂载' }).click();
  await expect(element).toHaveAttribute('speed', '1.8');
  await expect(element).toHaveJSProperty('renderer', 'canvas');
  await expect(element.locator('canvas')).toHaveCount(1);
});

test('Web Components upgrades properties and refreshes progress semantics', async ({ page }) => {
  await page.goto('http://127.0.0.1:4318/');
  await page.evaluate(async () => {
    const source = await fetch('/main.js').then(response => response.text());
    const imports = [...source.matchAll(/from "([^"]+)"/g)].map(match => match[1]);
    const load = name => import(imports.find(path => path.includes(`/packages/${name}/src/index.js`)));
    const [{ defineLoadingEffect }, { circularProgress }, { createCssRenderer }] =
      await Promise.all(['web-components', 'effects', 'renderer-css'].map(load));

    const element = document.createElement('test-loading-effect');
    element.effect = circularProgress.id;
    element.registry = {
      effects: { [circularProgress.id]: circularProgress },
      renderers: { css: createCssRenderer },
    };
    element.options = { progress: 42, progressSource: 'estimated' };
    element.style.height = '100px';
    document.body.prepend(element);
    if (defineLoadingEffect('test-loading-effect') !== defineLoadingEffect('test-loading-effect')) {
      throw new Error('Repeated registration must return the same constructor');
    }
  });
  const element = page.locator('test-loading-effect');
  await expect(element).toHaveJSProperty('renderer', 'css');
  await expect(element).toHaveAttribute('role', 'progressbar');
  await expect(element).toHaveAttribute('aria-valuetext', '预计 42%');
  await element.evaluate(node => node.setAttribute('progress', '80'));
  await expect(element).toHaveAttribute('aria-valuenow', '80');
  await element.evaluate(node => node.removeAttribute('progress'));
  await expect(element).toHaveAttribute('aria-valuenow', '42');
  await element.evaluate(node => { node.options = {}; });
  await expect(element).toHaveAttribute('role', 'status');
  await expect(element).not.toHaveAttribute('aria-valuenow', /.+/);
});
