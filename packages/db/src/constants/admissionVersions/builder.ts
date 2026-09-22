import type {
  AdmissionFieldDefinition,
  AdmissionVersion,
  SubversionDelta,
} from "./shared/types";
import { v1Version } from "./versions/v1";

// ─── Version Registry ───────────────────────────────────────────────────────

export const ADMISSION_VERSIONS: Record<string, AdmissionVersion> = {
  v1: v1Version,
};

// ─── Subversion Resolver ────────────────────────────────────────────────────

/**
 * Extract subversion details or latest active subversion.
 */
export const getSubversionModule = (
  versionKey: string,
  subversionNumber?: number
) => {
  const version = ADMISSION_VERSIONS[versionKey];
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
 * The latest subversion number for a given version key.
 * Returns 0 if the version doesn't exist.
 */
export const getLatestSubversionNumber = (versionKey: string): number => {
  const version = ADMISSION_VERSIONS[versionKey];
  if (!version) {
    return 0;
  }
  const keys = Object.keys(version.subversions).map(Number);
  return keys.length === 0 ? 0 : Math.max(...keys);
};

/**
 * Get the complete field list for a specific subversion.
 * Returns undefined if the version or subversion doesn't exist.
 */
export const getFieldsForSubversion = (
  versionKey: string,
  subversionNumber: number
): AdmissionFieldDefinition[] | undefined => {
  const mod = getSubversionModule(versionKey, subversionNumber);
  return mod?.fields;
};

// ─── Migration Utilities ────────────────────────────────────────────────────

/**
 * Evaluates the required updates when upgrading an application record from one
 * subversion to another.
 *
 * Walks each intermediate subversion's delta and collects:
 * - `newFields` — fields added between from and to
 * - `newlyRequired` — fields that existed but became required
 * - `removedFieldKeys` — fields removed between from and to
 * - `renamed` — fields whose key changed (old key/label paired with the new field)
 */
export const calculateMigrationRequirements = (
  versionKey: string,
  fromSubversion: number,
  toSubversion: number
) => {
  const version = ADMISSION_VERSIONS[versionKey];
  if (!version) {
    throw new Error(`Version '${versionKey}' not found.`);
  }

  const newFields: AdmissionFieldDefinition[] = [];
  const newlyRequired: AdmissionFieldDefinition[] = [];
  const removedFieldKeys: string[] = [];
  const renamed: { oldKey: string; field: AdmissionFieldDefinition }[] = [];

  for (let s = fromSubversion + 1; s <= toSubversion; s += 1) {
    const mod = version.subversions[s];
    if (!mod?.delta) {
      continue;
    }

    const delta: SubversionDelta = mod.delta;

    if (delta.added) {
      newFields.push(...delta.added);
    }
    if (delta.removed) {
      removedFieldKeys.push(...delta.removed);
    }
    if (delta.renamed) {
      for (const rename of delta.renamed) {
        const field = mod.fields.find((f) => f.key === rename.newKey);
          if (field) {
          renamed.push({ oldKey: rename.oldKey, field });
        }
      }
    }
    if (delta.patched) {
      for (const patch of delta.patched) {
        if (patch.patch.required) {
          const field = mod.fields.find((f) => f.key === patch.key);
          if (field) {
            newlyRequired.push(field);
          }
        }
      }
    }
  }

  return {
    newFields,
    newlyRequired,
    removedFieldKeys,
    renamed,
  };
};

/**
 * Compare two subversion numbers and return the fields that are
 * NEW (present in target but not in source) and fields that became
 * REQUIRED (not required in source but required in target).
 *
 * Used to determine what prompts to show when a user's application
 * is behind the latest subversion.
 */
export const getFieldsChangedBetweenSubversions = (
  versionKey: string,
  fromSubversion: number,
  toSubversion: number
): {
  newFields: AdmissionFieldDefinition[];
  newlyRequired: AdmissionFieldDefinition[];
} => {
  const fromFields = getFieldsForSubversion(versionKey, fromSubversion);
  const toFields = getFieldsForSubversion(versionKey, toSubversion);

  if (!fromFields || !toFields) {
    return { newFields: [], newlyRequired: [] };
  }

  const fromKeys = new Set(fromFields.map((f) => f.key));
  const fromRequiredMap = new Map(fromFields.map((f) => [f.key, f.required]));

  const newFields = toFields.filter((f) => !fromKeys.has(f.key));
  const newlyRequired: AdmissionFieldDefinition[] = [];

  for (const fld of toFields) {
    const wasInPrevious = fromKeys.has(fld.key);
    const wasRequired = fromRequiredMap.get(fld.key) ?? false;
    if (wasInPrevious && !wasRequired && fld.required) {
      newlyRequired.push(fld);
    }
  }

  return { newFields, newlyRequired };
};
