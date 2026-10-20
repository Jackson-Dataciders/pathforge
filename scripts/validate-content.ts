import { ContentError } from "../src/content/errors";
import { listPublishedCourses } from "../src/content/courses";
import { loadTaxonomy } from "../src/content/taxonomy";

function printError(error: unknown): void {
  if (error instanceof ContentError) {
    console.error(error.message);
    return;
  }

  if (error instanceof AggregateError) {
    for (const nestedError of error.errors) printError(nestedError);
    return;
  }

  console.error(error instanceof Error ? error.message : String(error));
}

try {
  loadTaxonomy();
  listPublishedCourses();
  console.log("Content validation passed.");
} catch (error) {
  printError(error);
  process.exitCode = 1;
}