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
