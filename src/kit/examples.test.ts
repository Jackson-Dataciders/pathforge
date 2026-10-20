import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { kitRegistry } from './registry';

describe('kit component examples', () => {
  it('provides a valid example for every registered component', () => {
    for (const definition of Object.values(kitRegistry)) {
      const examplePath = resolve('src/kit/components', definition.name, 'example.yaml');
      const example = parse(readFileSync(examplePath, 'utf8'));

      expect(definition.schema.safeParse(example), definition.name).toMatchObject({ success: true });
    }
  });
});