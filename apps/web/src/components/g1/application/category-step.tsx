import type {
  MarkingCategoryDefinition,
  MarkingCategoryEntry,
} from "@school-admissions/db/constants/markingVersions/index";
import {
  clearFieldAndDependents,
  groupFields,
  resolveFieldOptions,
  resolveFieldStates,
} from "@school-admissions/db/constants/markingVersions/index";
import { Badge } from "@school-admissions/ui/components/badge";
import { Button } from "@school-admissions/ui/components/button";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import { DynamicField } from "@/lib/g1/dynamic-field";

import { FieldGroupHeading } from "./field-group-heading";

export interface CategoryStepProps {
  categories: MarkingCategoryDefinition[];
  entries: MarkingCategoryEntry[];
  onChange: (entries: MarkingCategoryEntry[]) => void;
  /** The applicant's own home location (Location step), for a map-proximity field's radius/pins. */
  homePoint?: [number, number] | null;
  /** Jumps back to the Location step for a map-proximity field's "set your location" prompt. */
  onNavigateToLocation?: () => void;
  /** Locks every field and structural control (add/remove entry) \u2014 the application is no longer editable. */
  disabled?: boolean;
}

/**
* Renders the "categories" step entirely off `getCategoriesForSubversion` \u2014
 * unlike aloysius-g1's hardcoded `Category6XFields` switch, every category
 * (6.1-6.6, or whatever a future subversion adds) is rendered from its
 * `MarkingCategoryDefinition.fields` the same way admission steps render off
 * `AdmissionFieldDefinition`.
 */
export function CategoryStep({
  categories,
  entries,
  onChange,
  homePoint,
  onNavigateToLocation,
  disabled,
}: CategoryStepProps) {
  const entryCountByType = new Map<string, number>();
  for (const entry of entries) {
    entryCountByType.set(entry.type, (entryCountByType.get(entry.type) ?? 0) + 1);
  }
  const [activeType, setActiveType] = useState<string>(categories[0]?.type ?? "");

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-1">
        {categories.map((category) => {
          const count = entryCountByType.get(category.type) ?? 0;
          return (
            <Button
              key={category.type}
              type="button"
              size="sm"
              variant={category.type === activeType ? "default" : "outline"}
              onClick={() => setActiveType(category.type)}
            >
              {category.type}
              {count > 0 ? ` (${count})` : ""}
            </Button>
          );
        })}
      </div>
      {categories.map((category) => {
        const categoryEntries = entries.filter((e) => e.type === category.type);
        const excludedByExisting = (category.excludes ?? []).some(
          (excluded) => (entryCountByType.get(excluded) ?? 0) > 0
        );
        const canAddMore =
          !excludedByExisting &&
          (category.allowMultipleEntries || categoryEntries.length === 0);

        if (category.type !== activeType) {
          return null;
        }

        return (
          <div key={category.type} className="grid gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                {category.type}{" - "}{category.label}
                <Badge variant="secondary">{category.maxMarks} marks</Badge>
              </h3>
              <p className="text-xs text-muted-foreground">{category.description}</p>
              {excludedByExisting && (
                <p className="text-xs text-destructive">
                  Cannot be combined with {category.excludes?.join(", ")}, already entered above.
                </p>
              )}
            </div>
            {categoryEntries.map((entry) => (
                <CategoryEntryForm
                  key={entry.id}
                  category={category}
                  entry={entry}
                  homePoint={homePoint ?? null}
                  onNavigateToLocation={onNavigateToLocation}
                  disabled={disabled}
                  onChange={(inputs) =>
                    onChange(
                      entries.map((e) => (e.id === entry.id ? { ...e, inputs } : e))
                    )
                  }
                  onRemove={() => onChange(entries.filter((e) => e.id !== entry.id))}
                />
              ))}
              {canAddMore && !disabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() =>
                    onChange([
                      ...entries,
                      { id: crypto.randomUUID(), type: category.type, inputs: {} },
                    ])
                  }
                >
                  <IconPlus className="mr-1 size-4" />
                  {categoryEntries.length > 0 ? "Add another entry" : "Add this category"}
                </Button>
              )}
          </div>
        );
      })}
    </div>
  );
}

function CategoryEntryForm({
  category,
  entry,
  onChange,
  onRemove,
  homePoint,
  onNavigateToLocation,
  disabled,
}: {
  category: MarkingCategoryDefinition;
  entry: MarkingCategoryEntry;
  onChange: (inputs: Record<string, unknown>) => void;
  onRemove: () => void;
  homePoint: [number, number] | null;
  onNavigateToLocation?: () => void;
  disabled?: boolean;
}) {
  const states = resolveFieldStates(category.fields, entry.inputs);
  const options = resolveFieldOptions(category.fields, entry.inputs);
  const groups = groupFields(category.fields);

  return (
    <div className="grid gap-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Entry</span>
        <Button type="button" variant="ghost" size="icon" disabled={disabled} onClick={onRemove}>
          <IconTrash className="size-4" />
        </Button>
      </div>
      {groups.map((group, index) => (
        <div key={group.group ?? `__ungrouped_${index}`} className="grid gap-4">
          {group.group && <FieldGroupHeading>{group.group}</FieldGroupHeading>}
          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => {
              const state = states[field.key];
              return (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={entry.inputs[field.key]}
                  onChange={(value) =>
                    onChange({
                      ...clearFieldAndDependents(category.fields, field.key, entry.inputs),
                      [field.key]: value,
                    })
                  }
                  disabled={disabled || state?.disabled}
                  message={state?.message}
                  options={options[field.key]}
                  mapCenter={homePoint}
                  onNavigateToLocation={onNavigateToLocation}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
