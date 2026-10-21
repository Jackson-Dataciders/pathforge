import { evaluate } from '@mdx-js/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';
import * as runtime from 'react/jsx-runtime';
import { KitBlock } from './kit-block';
import { remarkKit } from './remark-kit';

export async function compileLesson(source: string, { file }: { file: string }) {
  'use cache';

  const { default: Lesson } = await evaluate(source, {
    ...runtime,
    format: 'md',
    remarkPlugins: [remarkFrontmatter, remarkGfm, [remarkKit, { file }]],
    rehypePlugins: [[rehypePrettyCode, {
      theme: { light: 'github-light', dark: 'github-dark' },
      keepBackground: false,
    }]],
    remarkRehypeOptions: { footnoteLabel: 'Sources' },
  });

  return <Lesson components={{ KitBlock }} />;
}