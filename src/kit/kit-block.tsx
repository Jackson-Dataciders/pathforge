import type { ComponentType } from 'react';
import { getKitComponent } from './registry';

export type KitBlockProps = { name: string; payload: string };

export function KitBlock({ name, payload }: KitBlockProps) {
  const definition = getKitComponent(name);
  if (!definition) throw new Error(`Unknown kit component "${name}"`);

  const Component = definition.component as ComponentType<Record<string, unknown>>;
  const props = JSON.parse(payload) as Record<string, unknown>;
  return <Component {...props} />;
}