import type { AdmissionFieldDefinition } from "@school-admissions/db/constants/admissionVersions/index";
import {
  groupFields,
  resolveFieldOptions,
  resolveFieldStates,
} from "@school-admissions/db/constants/admissionVersions/index";

import { DynamicField } from "@/lib/g1/dynamic-field";

import { FieldGroupHeading } from "./field-group-heading";

export interface StepSectionProps {
  /** Every field of the current subversion (states/options resolve against the full set, not just this step's). */
  allFields: AdmissionFieldDefinition[];
  /** Fields belonging to the step currently rendered. */
  stepFields: AdmissionFieldDefinition[];
  data: Record<string, unknown>;
  errors?: Record<string, string>;
  highlightKeys?: Set<string>;
  /** Locks every field regardless of per-field dependency state (e.g. the application is no longer editable). */
  disabled?: boolean;
  onFieldChange: (key: string, value: unknown) => void;
}

/** Renders one wizard step's fields, grouped by `field.group`, fully data-driven. */
export function StepSection({
  allFields,
  stepFields,
  data,
  errors,
  highlightKeys,
  disabled,
  onFieldChange,
}: StepSectionProps) {
  const states = resolveFieldStates(allFields, data);
  const options = resolveFieldOptions(allFields, data);
  const groups = groupFields(stepFields);

  return (
    <div className="grid gap-6">
      {groups.map((group, index) => (
        <div key={group.group ?? `__ungrouped_${index}`} className="grid gap-4">
          {group.group && <FieldGroupHeading>{group.group}</FieldGroupHeading>}
          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => {
              const state = states[field.key];
              if (state?.disabled && field.ui?.hideWhenNotApplicable) {
                return null;
              }
              return (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={data[field.key]}
                  onChange={(value) => onFieldChange(field.key, value)}
                  disabled={disabled || state?.disabled}
                  message={state?.message}
                  options={options[field.key]}
                  error={errors?.[field.key]}
                  highlighted={highlightKeys?.has(field.key)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
