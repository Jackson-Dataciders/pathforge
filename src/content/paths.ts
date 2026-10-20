import { resolve } from "node:path";

export function contentRoot(): string {
  const configuredRoot = process.env.PATHFORGE_CONTENT_ROOT;
  return configuredRoot
    ? resolve(process.cwd(), configuredRoot)
    : process.cwd();
}

export function coursesDir(): string {
  return resolve(contentRoot(), "courses");
}

export function catalogDir(root?: string): string {
  return resolve(root ?? contentRoot(), "catalog");
}

export function taxonomyFile(root?: string): string {
  return resolve(catalogDir(root), "taxonomy.yaml");
}

export function roadmapsDir(root?: string): string {
  return resolve(catalogDir(root), "roadmaps");
}

export function themesDir(): string {
  return resolve(process.cwd(), "themes");
}

export function pipelineDir(): string {
  return resolve(process.cwd(), "pipeline");
}
