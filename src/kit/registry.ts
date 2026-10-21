import type { ComponentType } from 'react';
import type { KitComponentDefinition } from './types';
import { ArrayViz } from './components/array-viz/ArrayViz';
import { arrayVizSchema } from './components/array-viz/schema';
import { Callout } from './components/callout/Callout';
import { calloutSchema } from './components/callout/schema';
import { Hint } from './components/hint/Hint';
import { hintSchema } from './components/hint/schema';
import { Diagram } from './components/diagram/Diagram';
import { diagramSchema } from './components/diagram/schema';
import { Tabs } from './components/tabs/Tabs';
import { tabsSchema } from './components/tabs/schema';
import { Stepper } from './components/stepper/Stepper';
import { stepperSchema } from './components/stepper/schema';
import { CodeWalkthrough } from './components/code-walkthrough/CodeWalkthrough';
import { codeWalkthroughSchema } from './components/code-walkthrough/schema';
import { CodeChallenge } from './components/code-challenge/CodeChallenge';
import { codeChallengeSchema } from './components/code-challenge/schema';
import { Quiz } from './components/quiz/Quiz';
import { quizSchema } from './components/quiz/schema';
import { GraphViz } from './components/graph-viz/GraphViz';
import { graphVizSchema } from './components/graph-viz/schema';

type RegisteredKitComponent = Omit<KitComponentDefinition, 'component'> & { component: ComponentType<never> };

export const kitRegistry: Record<string, RegisteredKitComponent> = {
  'array-viz': {
    name: 'array-viz',
    category: 'visualization',
    description: 'A step-by-step array, stack, or queue visualization.',
    schema: arrayVizSchema,
    component: ArrayViz,
    interactive: true,
  },
  callout: {
    name: 'callout',
    category: 'content',
    description: 'A themed note for important supporting information.',
    schema: calloutSchema,
    component: Callout,
    interactive: false,
  },
  'code-walkthrough': {
    name: 'code-walkthrough',
    category: 'animation',
    description: 'A code sample explained through highlighted line ranges, one step at a time.',
    schema: codeWalkthroughSchema,
    component: CodeWalkthrough,
    interactive: true,
  },
  'code-challenge': {
    name: 'code-challenge',
    category: 'assessment',
    description: 'An editable programming challenge checked against its tests.',
    schema: codeChallengeSchema,
    component: CodeChallenge,
    interactive: true,
  },
  diagram: {
    name: 'diagram',
    category: 'diagram',
    description: 'A Mermaid diagram themed to the active color palette.',
    schema: diagramSchema,
    component: Diagram,
    interactive: false,
  },
  'graph-viz': {
    name: 'graph-viz',
    category: 'visualization',
    description: 'A themed graph or tree with optional step-by-step highlighting.',
    schema: graphVizSchema,
    component: GraphViz,
    interactive: true,
  },
  hint: {
    name: 'hint',
    category: 'content',
    description: 'A collapsed disclosure for optional supporting guidance.',
    schema: hintSchema,
    component: Hint,
    interactive: true,
  },
  quiz: {
    name: 'quiz',
    category: 'assessment',
    description: 'An auto-graded lesson quiz with explanations and progress reporting.',
    schema: quizSchema,
    component: Quiz,
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
  stepper: {
    name: 'stepper',
    category: 'animation',
    description: 'A sequence of diagram or text frames with playback and step controls.',
    schema: stepperSchema,
    component: Stepper,
    interactive: true,
  },
};

export function getKitComponent(name: string): RegisteredKitComponent | undefined {
  return kitRegistry[name];
}