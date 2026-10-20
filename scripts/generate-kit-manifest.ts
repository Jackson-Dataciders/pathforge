import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { kitRegistry } from '../src/kit/registry';

const manifestPath = resolve('src/kit/manifest.json');
const components = Object.values(kitRegistry)
  .map((definition) => ({
    name: definition.name,
    category: definition.category,
    description: definition.description,
    interactive: definition.interactive,
    jsonSchema: z.toJSONSchema(definition.schema),
    example: parse(readFileSync(resolve('src/kit/components', definition.name, 'example.yaml'), 'utf8')),
  }))
  .sort((left, right) => left.name.localeCompare(right.name));
const generated = `${JSON.stringify({ components }, null, 2)}\n`;

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(manifestPath, 'utf8');
  } catch {
    current = '';
  }

  if (current !== generated) {
    console.error('Kit manifest is out of date. Run npm run kit:manifest.');
    process.exitCode = 1;
  }
} else {
  writeFileSync(manifestPath, generated);
}