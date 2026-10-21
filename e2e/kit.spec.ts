import { expect, test } from '@playwright/test';

test('showcase renders each registered component', async ({ page }) => {
  await page.goto('/kit');

  for (const name of ['callout', 'code-challenge', 'code-walkthrough', 'diagram', 'hint', 'quiz', 'stepper', 'tabs']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }

  const quiz = page.getByRole('region', { name: 'Knowledge check' });
  await quiz.getByRole('radio', { name: 'JavaScript' }).check();
  await quiz.getByRole('checkbox', { name: 'HTML' }).check();
  await quiz.getByRole('checkbox', { name: 'CSS' }).check();
  await quiz.getByRole('radio', { name: 'True' }).check();
  await quiz.getByRole('textbox', { name: 'Your answer' }).fill('html');
  await quiz.getByRole('button', { name: 'Check answers' }).click();
  await expect(quiz.getByText(/^Passed/)).toBeVisible();

  const stepper = page.getByRole('region', { name: 'From draft to publication' });
  await expect(stepper).toContainText('Start with a draft.');
  await stepper.getByRole('button', { name: 'Next step' }).click();
  await expect(stepper).toContainText('Review the lesson.');

  const diagram = page.getByRole('img', { name: 'Diagram', exact: true }).first();
  await expect(diagram.locator('svg')).toBeVisible();

  const challenge = page.getByRole('region', { name: 'Add two numbers' });
  await challenge.getByRole('button', { name: 'Run tests' }).click();
  await expect(challenge.getByText('Tests failed')).toBeVisible();

  const editor = challenge.locator('.cm-content');
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText('function sum(a, b) {\n  return a + b;\n}');
  await challenge.getByRole('button', { name: 'Run tests' }).click();
  await expect(challenge.getByText('All tests passed')).toBeVisible();
});