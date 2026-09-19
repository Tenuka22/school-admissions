import * as v from "valibot";

import type {
  MarkingCategoryDefinition,
  MarkingCategoryEntry,
} from "../shared/types";

/**
 * Builds a valibot object schema for a category entry's `inputs` from its
 * field definitions — primitives keyed by field key; `list` fields accept
 * arrays of unknown structured entries.
 */
export const buildEntrySchema = (
  category: MarkingCategoryDefinition
): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> => {
  const entries: Record<
    string,
    v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
  > = {};
  for (const field of category.fields) {
    switch (field.type) {
      case "number": {
        entries[field.key] = v.optional(v.number());
        break;
      }
      case "boolean": {
        entries[field.key] = v.optional(v.boolean());
        break;
      }
      case "list": {
        entries[field.key] = v.optional(v.array(v.unknown()));
        break;
      }
      case "map": {
        entries[field.key] = v.optional(v.array(v.string()));
        break;
      }
      default: {
        entries[field.key] = v.optional(v.string());
        break;
      }
    }
  }
  return v.object(entries);
};

/**
 * Validates that every entry in an application's `categories` array refers to
 * a category defined by the given marking subversion, respects
 * `allowMultipleEntries`, and honours mutual `excludes`.
 */
export const validateCategoryEntries = (
  categories: MarkingCategoryDefinition[],
  entries: MarkingCategoryEntry[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const byType = new Map(categories.map((c) => [c.type, c]));
  const entryCountByType = new Map<string, number>();
  for (const entry of entries) {
    entryCountByType.set(
      entry.type,
      (entryCountByType.get(entry.type) ?? 0) + 1
    );
  }

  for (const entry of entries) {
    const category = byType.get(entry.type);
    if (!category) {
      errors.push(`Unknown category type: ${entry.type}`);
      continue;
    }
    if (
      !category.allowMultipleEntries &&
      (entryCountByType.get(entry.type) ?? 0) > 1
    ) {
      errors.push(`Category ${entry.type} allows only one entry`);
    }
    for (const excluded of category.excludes ?? []) {
      if (entryCountByType.has(excluded)) {
        errors.push(
          `Category ${entry.type} cannot be combined with ${excluded}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
};
