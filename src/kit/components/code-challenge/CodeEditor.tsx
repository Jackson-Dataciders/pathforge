'use client';

import { javascript } from '@codemirror/lang-javascript';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';

const theme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-fg)',
  },
  '.cm-content': {
    caretColor: 'var(--color-accent)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--color-accent)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--color-surface)',
    border: 'none',
    color: 'var(--color-muted)',
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--color-accent) 24%, transparent)',
  },
});

export function CodeEditor({
  code,
  language,
  onChange,
}: {
  code: string;
  language: string;
  onChange: (value: string) => void;
}) {
  return (
    <CodeMirror
      aria-label="Code challenge editor"
      basicSetup={{ foldGutter: false }}
      extensions={[javascript({ typescript: language === 'typescript' })]}
      height="320px"
      onChange={onChange}
      theme={theme}
      value={code}
    />
  );
}