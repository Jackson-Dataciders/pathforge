import { expect, test } from '@playwright/test';

test('courses can be filtered by category and label from the URL', async ({ page }) => {
  await page.goto('/courses');

  await expect(page.getByRole('link', { name: 'HTTP Status Codes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Database Fundamentals' })).toBeVisible();

  await page.getByLabel('Category').selectOption('data');
  await expect(page).toHaveURL(/category=data/);
  await expect(page.getByRole('link', { name: 'Database Fundamentals' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'HTTP Status Codes' })).toHaveCount(0);

  await page.goto('/courses?label=databases');
  await expect(page.getByRole('link', { name: 'Database Fundamentals' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'HTTP Status Codes' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Clear filters' }).click();
  await expect(page).toHaveURL('/courses');
  await expect(page.getByRole('link', { name: 'HTTP Status Codes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Database Fundamentals' })).toBeVisible();
});

test('home page shows category counts from the published fixtures', async ({ page }) => {
  await page.goto('/');

  const backendLink = page.getByRole('link', { name: 'Backend', exact: true });
  await expect(backendLink).toHaveAttribute('href', '/courses?category=backend');
  await expect(page.locator('li').filter({ has: backendLink })).toContainText('1 course');

  const dataLink = page.getByRole('link', { name: 'Data', exact: true });
  await expect(dataLink).toHaveAttribute('href', '/courses?category=data');
  await expect(page.locator('li').filter({ has: dataLink })).toContainText('1 course');
});