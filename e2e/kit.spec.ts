import { expect, test } from '@playwright/test';

test('showcase renders each registered component', async ({ page }) => {
  await page.goto('/kit');

  for (const name of [
    'array-viz',
    'callout',
    'code-challenge',
    'code-walkthrough',
    'diagram',
    'graph-viz',
    'hint',
    'quiz',
    'stepper',
    'tabs',
  ]) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }

  const arrayViz = page.getByRole('region', { name: 'One bubble-sort pass' });
  await expect(arrayViz.getByRole('img')).toHaveAttribute('aria-label', /Values: 5, 1, 4, 2/);
  await arrayViz.getByRole('button', { name: 'Next step' }).click();
  await expect(arrayViz.getByRole('img')).toHaveAttribute('aria-label', /Values: 1, 5, 4, 2/);

  const graphViz = page.getByRole('region', { name: 'Breadth-first search' });
  await graphViz.getByRole('button', { name: 'Next step' }).click();
  await expect(graphViz.getByText('Highlighted nodes: Start.')).toBeAttached();
  await graphViz.getByRole('button', { name: 'Next step' }).click();
  await expect(graphViz.getByText('Highlighted nodes: Left branch.')).toBeAttached();

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

  const challenge = page.getByRole('region', { name: 'Add two numbers', exact: true });
  await challenge.getByRole('button', { name: 'Run tests' }).click();
  await expect(challenge.getByText('Tests failed')).toBeVisible();

  const editor = challenge.locator('.cm-content');
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText('function sum(a, b) {\n  return a + b;\n}');
  await challenge.getByRole('button', { name: 'Run tests' }).click();
  await expect(challenge.getByText('All tests passed')).toBeVisible();
});

test('Python code challenge passes with its reference solution', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/kit');

  const challenge = page.getByRole('region', { name: 'Add two numbers in Python' });
  const editor = challenge.locator('.cm-content');
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText('def add(a, b):\n    return a + b');
  await challenge.getByRole('button', { name: 'Run tests' }).click();
  await expect(challenge.getByText('All tests passed')).toBeVisible({ timeout: 60_000 });
});