import type { ComponentType } from 'react';
import type { KitComponentDefinition } from './types';
import { Callout } from './components/callout/Callout';
import { calloutSchema } from './components/callout/schema';
import { Hint } from './components/hint/Hint';
import { hintSchema } from './components/hint/schema';
import { Diagram } from './components/diagram/Diagram';
import { diagramSchema } from './components/diagram/schema';
import { Tabs } from './components/tabs/Tabs';
import { tabsSchema } from './components/tabs/schema';

type RegisteredKitComponent = Omit<KitComponentDefinition, 'component'> & { component: ComponentType<never> };

export const kitRegistry: Record<string, RegisteredKitComponent> = {
  callout: {
    name: 'callout',
    category: 'content',
    description: 'A themed note for important supporting information.',
    schema: calloutSchema,
    component: Callout,
    interactive: false,
  },
  diagram: {
    name: 'diagram',
    category: 'diagram',
    description: 'A Mermaid diagram themed to the active color palette.',
    schema: diagramSchema,
    component: Diagram,
    interactive: false,
  },
  hint: {
    name: 'hint',
    category: 'content',
    description: 'A collapsed disclosure for optional supporting guidance.',
    schema: hintSchema,
    component: Hint,
    interactive: true,
  },
  tabs: {
    name: 'tabs',
    category: 'content',
    description: 'A keyboard-accessible set of two to six content panels.',
    schema: tabsSchema,
    component: Tabs,
    interactive: true,
  },
};

export function getKitComponent(name: string): RegisteredKitComponent | undefined {
  return kitRegistry[name];
}