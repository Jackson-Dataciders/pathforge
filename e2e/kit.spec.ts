import { expect, test } from '@playwright/test';

test('showcase renders each registered component', async ({ page }) => {
  await page.goto('/kit');

  for (const name of ['callout', 'diagram', 'hint', 'tabs']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }

  const diagram = page.getByRole('img', { name: 'Diagram', exact: true });
  await expect(diagram.locator('svg')).toBeVisible();
});