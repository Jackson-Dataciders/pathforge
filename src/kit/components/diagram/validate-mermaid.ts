import { JSDOM } from 'jsdom';

export type MermaidValidationResult = { ok: true } | { ok: false; message: string };

export async function validateMermaid(code: string): Promise<MermaidValidationResult> {
  const dom = new JSDOM('');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');

  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: dom.window });
  Object.defineProperty(globalThis, 'document', { configurable: true, writable: true, value: dom.window.document });

  try {
    const mermaid = (await import('mermaid')).default;
    const parsed = await mermaid.parse(code);
    if (parsed) return { ok: true };
    return { ok: false, message: 'Mermaid did not recognize the diagram.' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  } finally {
    dom.window.close();
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else Reflect.deleteProperty(globalThis, 'document');
  }
}