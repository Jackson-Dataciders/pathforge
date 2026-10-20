---
status: planned
priority: medium
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0002-content-repository-layout.md
tags:
  - frontend
  - taxonomy
depends_on:
  - 004-taxonomy.md
  - 014-course-rendering.md
---
# Spec: 015-course-catalog

## Description
<!-- Written by me: what the feature should do, in plain words. -->
The Courses page lists all published courses with their category and labels and lets me filter by category and labels. The home page shows the categories with how many courses each has. Filters are part of the URL so I can bookmark a filtered view.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/content/catalog.ts`: `buildCatalog()` → `{ courses: CatalogEntry[], categories: { id, title, description, courseCount }[], labels: { id, title, courseCount }[] }`, where `CatalogEntry = { slug, title, summaryExcerpt (first sentence, max 200 chars), category, labels, lessonCount, totalMinutes }`. Pure `filterCatalog(entries, { category?, labels[] })` (labels combine with AND). Unit tests.
2. `src/components/catalog/course-card.tsx`: title link, excerpt, category, label chips, lesson count, minutes.
3. `src/components/catalog/catalog-filters.tsx` (client): category select ("All categories" + categories with courses) and label toggle chips; updates `?category=<id>&label=<id>&label=<id>` via `useRouter().replace`; "Clear filters" link.
4. `src/app/courses/page.tsx`: statically generated list of all entries; filtering happens on the client from `useSearchParams` with `filterCatalog` (wrap in `Suspense`). Empty-state text when no course matches: "No courses match these filters."
5. `src/app/page.tsx`: under the heading, a "Categories" grid with title, description, and course count, each linking to `/courses?category=<id>`; categories with zero courses are listed without a link and marked "No courses yet".
6. Add a second published fixture course `fixtures/content/courses/sample-course-two/` (different category, label `databases`) and the needed taxonomy entries in the fixture taxonomy.
7. `e2e/catalog.spec.ts`: both fixture courses listed; selecting a category hides the other course; label filter via URL works; clearing filters shows both.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Unknown `category` or `label` values in the URL are ignored (treated as no filter for that value).
- Courses are sorted by title.
- Only published courses appear.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Full-text search.
- Progress indicators on cards (spec 018).
- Roadmap links (spec 020).

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `src/content/catalog.ts` unit tests (counts, excerpt, AND label filter, unknown filter values) pass.
- [ ] `e2e/catalog.spec.ts` passes.
- [ ] The home page shows category course counts matching the fixtures (e2e).
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0002](../adr/0002-content-repository-layout.md) (taxonomy source).
- Uses `listPublishedCourses()` (spec 005) and `loadTaxonomy()` (spec 004). No new dependencies.
