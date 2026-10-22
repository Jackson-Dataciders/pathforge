import { listPublishedCourses } from "./courses";
import { contentRoot } from "./paths";
import { loadTaxonomy } from "./taxonomy";

export type CatalogTaxonomyItem = {
  id: string;
  title: string;
};

export type CatalogEntry = {
  slug: string;
  title: string;
  summaryExcerpt: string;
  category: CatalogTaxonomyItem;
  labels: CatalogTaxonomyItem[];
  lessonCount: number;
  totalMinutes: number;
};

export type Catalog = {
  courses: CatalogEntry[];
  categories: (CatalogTaxonomyItem & {
    description: string;
    courseCount: number;
  })[];
  labels: (CatalogTaxonomyItem & { courseCount: number })[];
};

export type CatalogFilters = {
  category?: string;
  labels?: string[];
};

export { filterCatalog } from "./catalog-filter";

function createSummaryExcerpt(summary: string): string {
  const text = summary
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const firstSentence = text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;
  const characters = Array.from(firstSentence.trim());

  return characters.length > 200
    ? `${characters.slice(0, 197).join("").trimEnd()}...`
    : firstSentence.trim();
}

export function buildCatalog(root?: string): Catalog {
  const base = root ?? contentRoot();
  const taxonomy = loadTaxonomy(base);
  const categories = taxonomy.categories.map((category) => ({
    ...category,
    courseCount: 0,
  }));
  const labels = taxonomy.labels.map((label) => ({ ...label, courseCount: 0 }));

  const courses = listPublishedCourses(base).map((course): CatalogEntry => {
    const categoryId = course.frontmatter.category ?? "";
    const category = taxonomy.categories.find(({ id }) => id === categoryId)!;
    const labelIds = new Set(course.frontmatter.labels ?? []);
    const courseLabels = taxonomy.labels.filter(({ id }) => labelIds.has(id));
    const lessons = course.lessons.filter(
      ({ stage }) => stage === "implemented",
    );

    categories.find(({ id }) => id === categoryId)!.courseCount += 1;
    for (const label of courseLabels) {
      labels.find(({ id }) => id === label.id)!.courseCount += 1;
    }

    return {
      slug: course.slug,
      title: course.frontmatter.title ?? course.slug,
      summaryExcerpt: createSummaryExcerpt(course.summary),
      category: { id: category.id, title: category.title },
      labels: courseLabels.map(({ id, title }) => ({ id, title })),
      lessonCount: lessons.length,
      totalMinutes: lessons.reduce(
        (total, lesson) => total + lesson.frontmatter.estimated_minutes,
        0,
      ),
    };
  });

  courses.sort((left, right) => left.title.localeCompare(right.title));
  return { courses, categories, labels };
}
