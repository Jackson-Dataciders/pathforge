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

export function catalogDir(): string {
  return resolve(contentRoot(), "catalog");
}

export function taxonomyFile(): string {
  return resolve(catalogDir(), "taxonomy.yaml");
}

export function roadmapsDir(): string {
  return resolve(catalogDir(), "roadmaps");
}

export function themesDir(): string {
  return resolve(process.cwd(), "themes");
}

export function pipelineDir(): string {
  return resolve(process.cwd(), "pipeline");
}
