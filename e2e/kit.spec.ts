import { expect, test } from '@playwright/test';

test('showcase renders each registered component', async ({ page }) => {
  await page.goto('/kit');

  for (const name of ['callout', 'code-walkthrough', 'diagram', 'hint', 'stepper', 'tabs']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }

  const stepper = page.getByRole('region', { name: 'From draft to publication' });
  await expect(stepper).toContainText('Start with a draft.');
  await stepper.getByRole('button', { name: 'Next step' }).click();
  await expect(stepper).toContainText('Review the lesson.');

  const diagram = page.getByRole('img', { name: 'Diagram', exact: true }).first();
  await expect(diagram.locator('svg')).toBeVisible();
});