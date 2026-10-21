import { expect, test } from '@playwright/test';

test('published course and lesson pages render their content and navigation', async ({ page }) => {
  await page.goto('/courses/sample-course');

  await expect(page.getByRole('heading', { name: 'HTTP Status Codes' })).toBeVisible();
  await expect(page.getByText('Backend')).toBeVisible();
  await expect(page.getByText('HTTP', { exact: true })).toBeVisible();
  await expect(page.getByText('13 min total')).toBeVisible();
  await expect(page.getByRole('link', { name: /Introduction/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Next Steps/ })).toBeVisible();

  await page.getByRole('link', { name: /Introduction/ }).click();
  await expect(page.locator('article[lang="en"]')).toBeVisible();
  await expect(page.getByRole('link', { name: /^Previous:/ })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Objectives' })).toBeVisible();
  await expect(page.getByText('Recognize the purpose of an HTTP status code.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Status code shape' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Diagram' }).locator('svg')).toBeVisible();

  const sources = page.locator('section[data-footnotes]');
  await expect(sources.getByRole('heading', { name: 'Sources' })).toBeVisible();
  await expect(sources.getByRole('link', { name: 'HTTP overview' })).toHaveAttribute(
    'href',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP',
  );

  const token = page.locator('.lesson-prose pre code span[style*="--shiki-light"]').first();
  await expect(token).toBeVisible();
  const lightColor = await token.evaluate((element) => getComputedStyle(element).color);
  expect(lightColor).toMatch(/^rgb\(/);

  await page.locator('html').evaluate((element) => element.classList.add('dark'));
  const darkColor = await token.evaluate((element) => getComputedStyle(element).color);
  expect(darkColor).toMatch(/^rgb\(/);
  expect(darkColor).not.toBe(lightColor);

  await page.getByRole('link', { name: 'Next: Next Steps' }).click();
  await expect(page.getByRole('link', { name: 'Previous: Introduction' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Next:/ })).toHaveCount(0);
});

test('unknown and unpublished courses return not found', async ({ page }) => {
  for (const slug of ['does-not-exist', 'draft-course', 'in-progress-course']) {
    await page.goto(`/courses/${slug}`);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  }

  await page.goto('/courses/sample-course/999-unknown-lesson');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});