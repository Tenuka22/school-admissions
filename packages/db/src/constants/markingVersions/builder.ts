import type { MarkingCategoryDefinition, MarkingVersion } from "./shared/types";
import { v1MarkingVersion } from "./versions/v1";

// ─── Version Registry ───────────────────────────────────────────────────────

export const MARKING_VERSIONS: Record<string, MarkingVersion> = {
  v1: v1MarkingVersion,
};

// ─── Subversion Resolver ────────────────────────────────────────────────────

/**
 * Extract subversion details or the latest active subversion.
 */
export const getMarkingSubversionModule = (
  versionKey: string,
  subversionNumber?: number
) => {
  const version = MARKING_VERSIONS[versionKey];
  if (!version) {
    return;
  }

  if (typeof subversionNumber === "number") {
    return version.subversions[subversionNumber];
  }

  const latestNumber = Math.max(
    ...Object.keys(version.subversions).map(Number)
  );
  return version.subversions[latestNumber];
};

/**
 * The latest subversion number for a marking version key.
 * Returns 0 if the version doesn't exist.
 */
export const getLatestMarkingSubversionNumber = (
  versionKey: string
): number => {
  const version = MARKING_VERSIONS[versionKey];
  if (!version) {
    return 0;
  }
  const keys = Object.keys(version.subversions).map(Number);
  return keys.length === 0 ? 0 : Math.max(...keys);
};

/**
 * Get the complete category list for a specific marking subversion.
 * Returns undefined if the version or subversion doesn't exist.
 */
export const getCategoriesForSubversion = (
  versionKey: string,
  subversionNumber: number
): MarkingCategoryDefinition[] | undefined => {
  const mod = getMarkingSubversionModule(versionKey, subversionNumber);
  return mod?.categories;
};

// ─── Migration Utilities ────────────────────────────────────────────────────

/**
 * Evaluates the required updates when upgrading an application's marking
 * from one subversion to another. Walks each intermediate subversion's
 * delta and collects added/removed/patched categories.
 */
export const calculateMarkingMigrationRequirements = (
  versionKey: string,
  fromSubversion: number,
  toSubversion: number
) => {
  const version = MARKING_VERSIONS[versionKey];
  if (!version) {
    throw new Error(`Marking version '${versionKey}' not found.`);
  }

  const newCategories: MarkingCategoryDefinition[] = [];
  const removedCategoryTypes: string[] = [];
  const patchedCategories: MarkingCategoryDefinition[] = [];

  for (let s = fromSubversion + 1; s <= toSubversion; s += 1) {
    const mod = version.subversions[s];
    if (!mod?.delta) {
      continue;
    }

    if (mod.delta.added) {
      newCategories.push(...mod.delta.added);
    }
    if (mod.delta.removed) {
      removedCategoryTypes.push(...mod.delta.removed);
    }
    if (mod.delta.patched) {
      for (const patch of mod.delta.patched) {
        const category = mod.categories.find((c) => c.type === patch.type);
        if (category) {
          patchedCategories.push(category);
        }
      }
    }
  }

  return {
    newCategories,
    removedCategoryTypes,
    patchedCategories,
  };
};
