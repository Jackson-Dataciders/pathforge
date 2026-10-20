import matter from 'gray-matter';
import { parse, stringify } from 'yaml';

export type MarkdownFile = {
  data: Record<string, unknown>;
  body: string;
};

const yamlEngine = {
  parse: (source: string) => parse(source.trim()) as Record<string, unknown>,
  stringify: (data: object) => stringify(data),
};

const matterOptions = { engines: { yaml: yamlEngine } };

export function parseMarkdownFile(text: string): MarkdownFile {
  const parsed = matter(text, matterOptions);
  return { data: parsed.data, body: parsed.content };
}

export function stringifyMarkdownFile(data: Record<string, unknown>, body: string): string {
  return matter.stringify(body, data, matterOptions);
}

function sectionBounds(body: string, heading: string) {
  const lines = body.split(/(?<=\n)/);
  let offset = 0;
  let start = -1;
  let end = body.length;

  for (const line of lines) {
    const lineText = line.replace(/\r?\n$/, '');
    if (start < 0 && new RegExp(`^##[ \\t]+${escapeRegExp(heading)}[ \\t]*$`).test(lineText)) {
      start = offset + line.length;
    } else if (start >= 0 && /^#{1,6}[ \t]+/.test(lineText)) {
      end = offset;
      break;
    }
    offset += line.length;
  }

  return { start, end };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getSection(body: string, heading: string): string {
  const { start, end } = sectionBounds(body, heading);
  return start < 0 ? '' : body.slice(start, end).trim();
}

export function setSection(body: string, heading: string, content: string): string {
  const normalizedContent = content.trim();
  const { start, end } = sectionBounds(body, heading);

  if (start >= 0) {
    const sectionEnd = end < body.length ? end : body.length;
    const replacement = normalizedContent ? `${normalizedContent}\n\n` : '';
    return `${body.slice(0, start)}${replacement}${body.slice(sectionEnd)}`;
  }

  const separator = body.length === 0 || body.endsWith('\n\n') ? '' : body.endsWith('\n') ? '\n' : '\n\n';
  return `${body}${separator}## ${heading}\n\n${normalizedContent}`;
}