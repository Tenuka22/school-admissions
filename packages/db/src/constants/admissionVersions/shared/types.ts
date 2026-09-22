import * as v from "valibot";

export const FieldTypeSchema = v.picklist([
  "text",
  "number",
  "date",
  "select",
  "boolean",
  "file",
  /** Structured phone number \u2014 stores country code and national number separately. */
  "phone",
  /** Map pin \u2014 the system derives values from the circle (e.g. nearby schools). */
  "map",
  /** Checkbox grid of the scored electoral-register year window (see `electoralRegisterYears`). */
  "electoralYears",
  /** Repeatable structured entries (e.g. sports achievements). */
  "list",
]);
export type FieldType = v.InferOutput<typeof FieldTypeSchema>;

/**
 * Step ordering matching the source aloysius-g1 application form.
 */
export type AdmissionStepKey =
  | "location"
  | "applicant"
  | "guardian"
  | "residence"
  | "categories"
  | "declaration"
  | "review";
export const ADMISSION_STEPS: AdmissionStepKey[] = [
  "location",
  "applicant",
  "guardian",
  "residence",
  "categories",
  "declaration",
  "review",
];

/**
 * A map-based proximity field: the applicant pins their home on the map, the
 * system counts gender-compatible government schools within a radius, and
 * marks are DEDUCTED per school — starting from `maxMarks` (fewer nearby
 * schools = fewer alternatives = higher marks), floored at 0. The radius
 * itself is not configured here: it's the applicant's actual home-to-school
 * distance (see `compatibleSchoolsWithinRadius` in
 * `@school-admissions/db/constants/schools`), so it can never be gamed by
 * tuning a fixed number per category.
 */
export interface AdmissionMapFieldConfig {
  /** Starting marks before the per-school deduction. */
  maxMarks: number;
  /** Marks removed per school found within the circle. */
  pointsPerSchool: number;
}

/** Values compared against another field's current value in dependency rules. */
export type DependencyValue = string | number | boolean;

/** Single condition: `data[field]` must be one of `in` for the rule to hold. */
export interface FieldDependencyCondition {
  field: string;
  in: DependencyValue[];
}

/**
 * Cross-field gate declared on the CONTROLLING field: `requires` cannot be
 * entered unless this field's value is one of `in`.
 */
export interface FieldGate {
  requires: string[];
  in: DependencyValue[];
  /** Message shown when a gated field is attempted. */
  message: string;
}

/**
 * Cascading-select rule declared on the PARENT select: the options of
 * `field` are filtered to `optionsByValue[parentValue]`.
 */
export interface FieldOptionRestriction {
  field: string;
  optionsByValue: Record<string, string[]>;
}

/**
 * Value-level rule checked against the field's OWN current value (unlike
 * `visibleWhen`/`gates`, which check other fields to decide enterability).
 * Shaped as a discriminated union on `kind` so more rule kinds can be added
 * later without touching every existing field definition.
 */
export interface FieldDateRangeRule {
  kind: "dateRange";
  /** Inclusive earliest allowed ISO date (yyyy-mm-dd). */
  minDate: string;
  /** Inclusive latest allowed ISO date (yyyy-mm-dd). */
  maxDate: string;
  /** Shown under the field when the value falls outside the range. */
  message: string;
  /** ISO cutoff date the live "will be N years old" preview measures against. */
  ageAsOf?: string;
  /** Suffix appended after the computed age in the preview, e.g. "at the 2027 intake". */
  ageLabel?: string;
}

/** Arbitrary value-level check \u2014 NIC/phone format validators use this instead of a bespoke rule kind each. */
export interface FieldValidatorRule {
  kind: "validator";
  /** Returns `true` when `value` is valid; only invoked once the field has a non-empty value. */
  validate: (value: unknown) => boolean;
  /** Shown under the field when `validate` returns `false`. */
  message: string;
}
export type FieldRule = FieldDateRangeRule | FieldValidatorRule;

/** Enterable state of a field resolved against the current form data. */
export interface FieldResolution {
  disabled: boolean;
  message?: string;
}

/** How a location coordinate may be entered manually. */
export type CoordinateFormat = "decimal" | "dms";

/**
 * UI behaviour overrides for a single field. Configured here in the version
 * definition — the form renderer reads these instead of hard-coding label
 * visibility or help text.
 */
export interface FieldUiConfig {
  /** Render the field's label above the control. Default: true. */
  showLabel?: boolean;
  /** Helper text rendered under the control. */
  description?: string;
  /** Value is written by the system (e.g. the location capture), never typed. */
  readOnly?: boolean;
  /**
   * Skip rendering the field entirely (instead of the default greyed-out
   * "Not applicable" control) when a `visibleWhen` condition fails \u2014 for
   * fields whose whole point is to disappear, like an address mirrored from
   * another field while a "same as" toggle holds.
   */
  hideWhenNotApplicable?: boolean;
}

/**
 * Behaviour of the location step's capture controls. Configured per
 * subversion in the version definition — the form offers GPS, manual
 * coordinate entry (decimal and/or degrees-minutes-seconds) and map
 * click-to-pin according to this config rather than hard-coded behaviour.
 */
export interface LocationCaptureConfig {
  /** Offer a "Use GPS location" button (navigator.geolocation). */
  enableGps?: boolean;
  /** Offer the manual coordinates entry popover. */
  enableManualEntry?: boolean;
  /** Formats offered in the manual entry popover. Default: both. */
  coordinateFormats?: CoordinateFormat[];
  /** Allow dropping the pin by clicking the map. */
  enableMapPin?: boolean;
  /** Field key the captured latitude is written to. */
  latitudeField?: string;
  /** Field key the captured longitude is written to. */
  longitudeField?: string;
  /** Field key recording how the point was captured. */
  sourceField?: string;
  /** Field key an auto-generated human-readable label is written to. */
  labelField?: string;
  /**
   * Field key the reverse-geocoded address is written to. When set, the
   * capture controls resolve the point to a street address and write it
   * here (and into `labelField`), falling back to raw coordinates.
   */
  addressField?: string;
}

export interface AdmissionFieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  /** The form step this field renders in (g1 groups the form by steps). */
  step: AdmissionStepKey;
  /** Sub-divider for groupings inside a step (e.g. "Permanent Address"). */
  group?: string;
  /** Map field's proximity-deduction config (schools counted inside the circle). */
  mapConfig?: AdmissionMapFieldConfig;
  /** Select field whose options come from a shared enum schema (e.g. districts). */
  enumSchema?: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;
  /** Fields that cannot be entered unless this field matches the gate values. */
  gates?: FieldGate[];
  /** This field is only shown/enabled when every condition holds. */
  visibleWhen?: FieldDependencyCondition[];
  /** Fields cleared (recursively, including their dependents) when this field changes. */
  clearsOnChange?: string[];
  /** Cascading-select behaviour: restricts options of the listed selects. */
  restrictsOptions?: FieldOptionRestriction[];
  /** Declarative value-level validation (e.g. a birth-date eligibility window). */
  rules?: FieldRule[];
  /** UI behaviour overrides (label visibility, help text) \u2014 version-driven. */
  ui?: FieldUiConfig;
  /** Value a new application starts with (e.g. a toggle defaulting on). */
  defaultValue?: unknown;
}

/**
 * Resolves which fields are enterable given the current form data:
 * - `visibleWhen` fails → field disabled ("Not applicable")
 * - a gate from another field is unsatisfied → field disabled with that message
 */
export const resolveFieldStates = (
  fields: AdmissionFieldDefinition[],
  data: Record<string, unknown>
): Record<string, FieldResolution> => {
  const states: Record<string, FieldResolution> = {};
  for (const field of fields) {
    states[field.key] = { disabled: false };
  }

  for (const field of fields) {
    const visible = (field.visibleWhen ?? []).every((condition) =>
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

/** Value-level errors for the current form data, driven by each field's declared `rules`. */
export const resolveFieldErrors = (
  fields: AdmissionFieldDefinition[],
  data: Record<string, unknown>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = data[field.key];
    if (value === undefined || value === null || value === "") {
      continue;
    }
    for (const rule of field.rules ?? []) {
      // ISO yyyy-mm-dd dates sort lexicographically, so string comparison
      // is exact \u2014 no Date parsing/timezone drift.
      if (rule.kind === "dateRange" && typeof value === "string" && (value < rule.minDate || value > rule.maxDate)) {
        errors[field.key] = rule.message;
      }
      if (rule.kind === "validator" && !rule.validate(value)) {
        errors[field.key] = rule.message;
      }
    }
  }
  return errors;
};

/** Options available for a select after applying every parent restriction. */
export const resolveFieldOptions = (
  fields: AdmissionFieldDefinition[],
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

/** Groups a field list by their `group` sub-divider, preserving order. */
export const groupFields = (
  fields: AdmissionFieldDefinition[]
): { group: string | undefined; fields: AdmissionFieldDefinition[] }[] => {
  const groups: {
    group: string | undefined;
    fields: AdmissionFieldDefinition[];
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

/** Key → field definition lookup for the dependency walk. */
const fieldByKey = (
  fields: AdmissionFieldDefinition[]
): Map<string, AdmissionFieldDefinition> =>
  new Map(fields.map((field) => [field.key, field]));

/**
 * Recursively clears `key` and every field listed in its `clearsOnChange`
 * (transitively — each cleared controller clears its own dependents too).
 * Used when a parent select changes so stale child selections never survive
 * a parent flip.
 */
export const clearFieldAndDependents = (
  fields: AdmissionFieldDefinition[],
  key: string,
  data: Record<string, unknown>
): Record<string, unknown> => {
  const next = { ...data };
  const byKey = fieldByKey(fields);

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

export type SubversionAction = "added" | "removed" | "patched" | "renamed";

export interface SubversionDelta {
  added?: AdmissionFieldDefinition[];
  removed?: string[];
  patched?: {
    key: string;
    patch: Partial<Omit<AdmissionFieldDefinition, "key">>;
    /** Explanation of why this field changed (e.g. "parentEmail made required") */
    reason?: string;
    /** If the field type changed, describes the conversion (e.g. "number => string") */
    convertedFrom?: string;
  }[];
  renamed?: {
    oldKey: string;
    newKey: string;
  }[];
}

export interface SubversionModule<
  TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> =
    v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
> {
  subversion: number;
  description: string;
  createdAt: string;
  schema: TSchema;
  fields: AdmissionFieldDefinition[];
  delta?: SubversionDelta;
  /** Location step capture behaviour (GPS / manual entry / map pin). */
  locationCapture?: LocationCaptureConfig;
}

export interface AdmissionVersion {
  key: string;
  intakeYear: number;
  description: string;
  subversions: Record<number, SubversionModule>;
}
