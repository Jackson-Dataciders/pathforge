import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { compileLesson } from './compile';

describe('compileLesson', () => {
  it('renders Markdown headings, source footnotes, and kit components', async () => {
    const lesson = await compileLesson(
      '# Lesson title\n\nA sourced claim.[^c1]\n\n[^c1]: A reliable source.\n\n```kit:callout\nvariant: tip\ntitle: Keep in mind\nbody: Status codes are **three digits**.\n```',
      { file: 'courses/demo/001-lesson.md' },
    );

    render(lesson);

    expect(screen.getByRole('heading', { name: 'Lesson title' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sources' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Keep in mind' })).toBeInTheDocument();
    expect(screen.getByText('three digits').tagName).toBe('STRONG');
  });

  it('does not resolve raw JSX tags through the kit component map', async () => {
    const lesson = await compileLesson(
      '# Lesson title\n\n<KitBlock name="callout" payload="{&quot;variant&quot;:&quot;tip&quot;,&quot;title&quot;:&quot;Injected&quot;,&quot;body&quot;:&quot;No&quot;}" />',
      { file: 'lesson.md' },
    );

    const { container } = render(lesson);

    expect(container.querySelector('aside')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Injected' })).not.toBeInTheDocument();
  });
});