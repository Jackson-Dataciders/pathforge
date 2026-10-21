import { javascriptBrowserRunner } from './javascript/browser';
import { javascriptNodeRunner } from './javascript/node';
import { pythonBrowserRunner } from './python/browser';
import { pythonNodeRunner } from './python/node';
import { SUPPORTED_CODE_LANGUAGES, type BrowserRunner, type NodeRunner } from './types';

export { SUPPORTED_CODE_LANGUAGES };

export const browserRunners: BrowserRunner[] = [javascriptBrowserRunner, pythonBrowserRunner];
export const nodeRunners: NodeRunner[] = [javascriptNodeRunner, pythonNodeRunner];

export function getBrowserRunner(language: string): BrowserRunner | undefined {
  return browserRunners.find((runner) => runner.languages.includes(language));
}

export function getNodeRunner(language: string): NodeRunner | undefined {
  return nodeRunners.find((runner) => runner.languages.includes(language));
}

export function isSupportedCodeLanguage(language: string): boolean {
  return language === 'none' || (SUPPORTED_CODE_LANGUAGES as readonly string[]).includes(language);
}