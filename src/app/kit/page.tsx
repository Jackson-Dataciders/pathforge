import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compileLesson } from '@/kit/compile';
import { kitRegistry } from '@/kit/registry';

export default async function KitPage() {
  const source = Object.values(kitRegistry)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((definition) => {
      const example = readFileSync(
        resolve('src/kit/components', definition.name, 'example.yaml'),
        'utf8',
      ).trimEnd();
      return `## ${definition.name}\n\n\`\`\`kit:${definition.name}\n${example}\n\`\`\``;
    })
    .join('\n\n');

  return (
    <section>
      <h1 className="mb-8 text-3xl font-semibold">Component kit</h1>
      <div className="space-y-8">{await compileLesson(source, { file: 'kit-showcase.md' })}</div>
    </section>
  );
}