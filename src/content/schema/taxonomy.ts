import { z } from "zod";

const taxonomyIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const categorySchema = z.object({
  id: taxonomyIdSchema,
  title: z.string(),
  description: z.string(),
  roadmap: z.string().nullable(),
});

const labelSchema = z.object({
  id: taxonomyIdSchema,
  title: z.string(),
  description: z.string().optional(),
});

export const taxonomySchema = z
  .object({
    version: z.literal(1),
    categories: z.array(categorySchema),
    labels: z.array(labelSchema),
  })
  .superRefine((taxonomy, context) => {
    for (const [field, items] of [
      ["categories", taxonomy.categories],
      ["labels", taxonomy.labels],
    ] as const) {
      const seen = new Set<string>();

      items.forEach((item, index) => {
        if (seen.has(item.id)) {
          context.addIssue({
            code: "custom",
            path: [field, index, "id"],
            message: `Duplicate ${field === "categories" ? "category" : "label"} id: ${item.id}`,
          });
        }
        seen.add(item.id);
      });
    }
  });

export type Category = z.infer<typeof categorySchema>;
export type Label = z.infer<typeof labelSchema>;
export type Taxonomy = z.infer<typeof taxonomySchema>;