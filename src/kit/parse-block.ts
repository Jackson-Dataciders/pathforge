import { parseDocument } from 'yaml';
import { getKitComponent } from './registry';

export type ParseKitBlockOptions = {
  name: string;
  yamlText: string;
  file: string;
  line: number;
};

export class KitBlockError extends Error {
  constructor(
    readonly file: string,
    readonly line: number,
    readonly component: string,
    readonly issues: string[],
  ) {
    super(`${file}:${line} kit:${component}: ${issues.join('; ')}`);
    this.name = 'KitBlockError';
  }
}

export function parseKitBlock({ name, yamlText, file, line }: ParseKitBlockOptions): Record<string, unknown> {
  const definition = getKitComponent(name);
  if (!definition) {
    throw new KitBlockError(file, line, name, [`Unknown kit component "${name}"`]);
  }

  const document = parseDocument(yamlText);
  if (document.errors.length > 0) {
    throw new KitBlockError(file, line, name, document.errors.map((error) => error.message));
  }

  const value: unknown = document.toJS();
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new KitBlockError(file, line, name, ['Component props must be a YAML mapping']);
  }

  const result = definition.schema.safeParse(value);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    });
    throw new KitBlockError(file, line, name, issues);
  }

  const props = result.data as Record<string, unknown>;
  if (definition.interactive) {
    const id = props.id;
    if (typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      throw new KitBlockError(file, line, name, ['Interactive components require a kebab-case string id']);
    }
  }

  return props;
}