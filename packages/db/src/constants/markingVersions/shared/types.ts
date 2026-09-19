import type {
  AdmissionFieldDefinition,
  AdmissionMapFieldConfig,
  DependencyValue,
  FieldGate,
  FieldDependencyCondition,
} from "../../admissionVersions/shared/types";

/**
 * A scored field of a marking category — same shape as an admission field
 * (steps, groups, dependencies), plus the map-proximity deduction config.
 */
export type MarkingFieldDefinition = AdmissionFieldDefinition;

/** Map-proximity deduction config shared with the admission side. */
export type MarkingMapFieldConfig = AdmissionMapFieldConfig;

export type MarkingCategoryType = "6.1" | "6.2" | "6.3" | "6.4" | "6.5" | "6.6";
export const MARKING_CATEGORY_TYPES: MarkingCategoryType[] = [
  "6.1",
  "6.2",
  "6.3",
  "6.4",
  "6.5",
  "6.6",
];

/** Step ordering matching the source aloysius-g1 application form. */
export type MarkingStepKey =
  | "location"
  | "applicant"
  | "guardian"
  | "residence"
  | "categories"
  | "declaration"
  | "review";
export const MARKING_STEPS: MarkingStepKey[] = [
  "location",
  "applicant",
  "guardian",
  "residence",
  "categories",
  "declaration",
  "review",
];

/**
 * A markable category of the marking scheme (e.g. "6.1 Residence
 * Verification & Proximity"). Each version's `categories` array lists which
 * categories exist, each with its own scored fields and caps.
 */
export interface MarkingCategoryDefinition {
  /** Circular category number (e.g. "6.1"). */
  type: MarkingCategoryType;
  label: string;
  description: string;
  /** Maximum marks this category can award (100 for every g1 category). */
  maxMarks: number;
  /** Whether an applicant may add more than one entry of this category. */
  allowMultipleEntries: boolean;
  /** The form step this category's fields render in (g1 groups by steps). */
  step: MarkingStepKey;
  /** Scored fields belonging to this category (version-specific). */
  fields: MarkingFieldDefinition[];
  /** Cross-field gates where one scored field enables others. */
  fieldGates?: FieldGate[];
  /** Categories that cannot coexist with this one on the same application. */
  excludes?: MarkingCategoryType[];
}

/**
 * One entry in an application's `categories` array. Each entry addresses a
 * `MarkingCategoryDefinition` by `type` and carries its own input values.
 */
export interface MarkingCategoryEntry<TInputs = Record<string, unknown>> {
  id: string;
  type: MarkingCategoryType;
  /** Field values for this entry — shape defined by the category's fields. */
  inputs: TInputs;
}

// ─── Delta system (mirrors admission SubversionDelta) ───────────────────────

export type MarkingCategoryAction = "added" | "removed" | "patched" | "renamed";

export interface MarkingSubversionDelta {
  added?: MarkingCategoryDefinition[];
  removed?: MarkingCategoryType[];
  patched?: {
    type: MarkingCategoryType;
    patch: Partial<Omit<MarkingCategoryDefinition, "type">>;
    reason?: string;
  }[];
  renamed?: {
    oldType: MarkingCategoryType;
    newType: MarkingCategoryType;
  }[];
}

export interface MarkingSubversionModule {
  subversion: number;
  description: string;
  createdAt: string;
  /** Complete category list at this point in time. */
  categories: MarkingCategoryDefinition[];
  delta?: MarkingSubversionDelta;
}

export interface MarkingVersion {
  key: string;
  intakeYear: number;
  description: string;
  subversions: Record<number, MarkingSubversionModule>;
}

/** Non-enterable state for a field resolved against current entry inputs. */
export interface FieldResolution {
  disabled: boolean;
  message?: string;
}

/**
 * Resolves which fields are enterable given the current entry inputs:
 * - `visibleWhen` fails → field disabled ("Not applicable")
 * - a gate from another field is unsatisfied → field disabled with that message
 */
export const resolveFieldStates = (
  fields: MarkingFieldDefinition[],
  data: Record<string, unknown>
): Record<string, FieldResolution> => {
  const states: Record<string, FieldResolution> = {};
  for (const field of fields) {
    states[field.key] = { disabled: false };
  }

  for (const field of fields) {
    const visible = (field.visibleWhen ?? []).every(
      (condition: FieldDependencyCondition) =>
        condition.in.includes(data[condition.field] as DependencyValue)
    );
    if (!visible) {
      states[field.key] = { disabled: true, message: "Not applicable" };
    }

    for (const gate of field.gates ?? []) {
      const matches = gate.in.includes(data[field.key] as DependencyValue);
      if (!matches) {
        for (const dependentKey of gate.requires) {
          states[dependentKey] = { disabled: true, message: gate.message };
        }
      }
    }
  }

  return states;
};

/** Options available for a select after applying every parent restriction. */
export const resolveFieldOptions = (
  fields: MarkingFieldDefinition[],
  data: Record<string, unknown>
): Record<string, string[]> => {
  const options: Record<string, string[]> = {};
  for (const field of fields) {
    if (field.type !== "select") {
      continue;
    }
    const enumOptions = field.enumSchema
      ? (field.enumSchema as { options?: readonly unknown[] }).options?.map(
          String
        )
      : undefined;
    const base = enumOptions ?? field.options ?? [];

    let allowed: string[] | undefined;
    for (const parent of fields) {
      for (const restriction of parent.restrictsOptions ?? []) {
        if (restriction.field !== field.key) {
          continue;
        }
        const parentValue = data[parent.key];
        if (
          typeof parentValue !== "string" ||
          !(parentValue in restriction.optionsByValue)
        ) {
          continue;
        }
        const permittedValues = restriction.optionsByValue[parentValue];
        if (!permittedValues) {
          continue;
        }
        const permitted = new Set(permittedValues);
        allowed = allowed
          ? allowed.filter((o) => permitted.has(o))
          : [...permitted];
      }
    }

    options[field.key] = allowed ?? [...base];
  }
  return options;
};

/**
 * Recursively clears `key` and every field listed in its `clearsOnChange`
 * (transitively — each cleared controller clears its own dependents too).
 */
export const clearFieldAndDependents = (
  fields: MarkingFieldDefinition[],
  key: string,
  data: Record<string, unknown>
): Record<string, unknown> => {
  const next = { ...data };
  const byKey = new Map(fields.map((field) => [field.key, field] as const));

  const queue = [key];
  const cleared = new Set<string>();
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || cleared.has(current)) {
      continue;
    }
    cleared.add(current);
    next[current] = null;
    for (const dependent of byKey.get(current)?.clearsOnChange ?? []) {
      queue.push(dependent);
    }
  }
  return next;
};

/** Groups a category's fields by their `group` sub-divider, preserving order. */
export const groupFields = (
  fields: MarkingFieldDefinition[]
): { group: string | undefined; fields: MarkingFieldDefinition[] }[] => {
  const groups: {
    group: string | undefined;
    fields: MarkingFieldDefinition[];
  }[] = [];
  const indexByGroup = new Map<string | undefined, number>();
  for (const field of fields) {
    const key = field.group;
    const existingIndex = indexByGroup.get(key);
    if (existingIndex === undefined) {
      indexByGroup.set(key, groups.length);
      groups.push({ group: key, fields: [field] });
    } else {
      groups[existingIndex]?.fields.push(field);
    }
  }
  return groups;
};

export type {
  AdmissionFieldDefinition,
  DependencyValue,
  FieldDependencyCondition,
  FieldGate,
} from "../../admissionVersions/shared/types";
