import type { ComponentType } from 'react';
import type { ZodType } from 'zod';
import type { z } from 'zod';

export type KitCategory = 'content' | 'diagram' | 'animation' | 'assessment' | 'visualization';

export type KitComponentDefinition<S extends ZodType = ZodType> = {
  name: string;
  category: KitCategory;
  description: string;
  schema: S;
  component: ComponentType<z.infer<S>>;
  interactive: boolean;
};