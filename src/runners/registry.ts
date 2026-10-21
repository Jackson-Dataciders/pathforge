import { javascriptBrowserRunner } from './javascript/browser';
import { javascriptNodeRunner } from './javascript/node';
import { SUPPORTED_CODE_LANGUAGES, type BrowserRunner, type NodeRunner } from './types';

export { SUPPORTED_CODE_LANGUAGES };

export const browserRunners: BrowserRunner[] = [javascriptBrowserRunner];
export const nodeRunners: NodeRunner[] = [javascriptNodeRunner];

export function getBrowserRunner(language: string): BrowserRunner | undefined {
  return browserRunners.find((runner) => runner.languages.includes(language));
}

export function getNodeRunner(language: string): NodeRunner | undefined {
  return nodeRunners.find((runner) => runner.languages.includes(language));
}

export function isSupportedCodeLanguage(language: string): boolean {
  return language === 'none' || (SUPPORTED_CODE_LANGUAGES as readonly string[]).includes(language);
}