import type {
  AdmissionFieldDefinition,
  FieldDateRangeRule,
  PhoneNumberValue,
} from "@school-admissions/db/constants/admissionVersions/index";
import { DISTRICT_LABELS, DIVISION_LABELS, lookupLabel } from "@school-admissions/db/constants/admissionVersions/index";
import { electoralRegisterYears } from "@school-admissions/db/constants/markingVersions/index";
import { Badge } from "@school-admissions/ui/components/badge";
import { Button } from "@school-admissions/ui/components/button";
import { Calendar } from "@school-admissions/ui/components/calendar";
import { Checkbox } from "@school-admissions/ui/components/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@school-admissions/ui/components/field";
import { Input } from "@school-admissions/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@school-admissions/ui/components/popover";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@school-admissions/ui/components/combobox";
import { Switch } from "@school-admissions/ui/components/switch";
import { IconCalendar, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import { DOCUMENT_OPTION_LABELS } from "@/lib/g1/document-option-labels";
import { ageBetween } from "@/lib/g1/age";
import { CATEGORY_OPTION_LABELS } from "@/lib/g1/category-option-labels";
import { NearbySchoolsField } from "@/lib/g1/nearby-schools-field";
import { PhoneNumberField } from "@/lib/g1/phone-number-field";

/**
 * A single field definition rendered dynamically off the version's schema.
 * `MarkingFieldDefinition` is a type alias of `AdmissionFieldDefinition`, so
 * this component is reused for both the admission-form steps and the
 * marking category steps.
 */
export type DynamicFieldDefinition = AdmissionFieldDefinition;

export interface DynamicFieldProps {
  field: DynamicFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  message?: string;
  options?: string[];
  error?: string;
  /** New this subversion — shown with a small badge instead of wrapping the whole field in a box. */
  highlighted?: boolean;
  /** The applicant's own home location (Location step) for a "map" proximity field's radius/pins. */
  mapCenter?: [number, number] | null;
  /** Jumps back to the Location step; shown by a "map" field when mapCenter is unset. */
  onNavigateToLocation?: () => void;
}

/** Renders the control matching `field.type`, driven entirely by version data. */
export function DynamicField({
  field,
  value,
  onChange,
  disabled,
  message,
  options,
  error,
  highlighted,
  mapCenter,
  onNavigateToLocation,
}: DynamicFieldProps) {
  const showLabel = field.ui?.showLabel ?? true;
  const readOnly = field.ui?.readOnly ?? false;
  const description = field.ui?.description ?? message;

  return (
    <Field data-invalid={Boolean(error)} className={field.type === "map" ? "sm:col-span-2" : undefined}>
      {showLabel && (
        <FieldLabel htmlFor={field.key} className="flex items-center gap-1.5">
          {field.label}
          {field.required && <span className="text-destructive"> *</span>}
          {highlighted && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[0.6rem]">
              New
            </Badge>
          )}
        </FieldLabel>
      )}
      <FieldContent>
        {renderControl({
          field,
          value,
          onChange,
          disabled: disabled || readOnly,
          options,
          mapCenter,
          onNavigateToLocation,
        })}
        {description && <FieldDescription>{description}</FieldDescription>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </FieldContent>
    </Field>
  );
}

function renderControl({
  field,
  value,
  onChange,
  disabled,
  options,
  mapCenter,
  onNavigateToLocation,
}: {
  field: DynamicFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  options?: string[];
  mapCenter?: [number, number] | null;
  onNavigateToLocation?: () => void;
}) {
  switch (field.type) {
    case "text": {
      return (
        <Input
          id={field.key}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
    case "number": {
      return (
        <Input
          id={field.key}
          type="number"
          value={typeof value === "number" ? value : ""}
          disabled={disabled}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
        />
      );
    }
    case "boolean": {
      return (
        <Switch
          id={field.key}
          checked={value === true}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(checked)}
        />
      );
    }
    case "select": {
      const opts = options ?? field.options ?? [];
      const labelFor = (opt: string) =>
        DOCUMENT_OPTION_LABELS[opt] ?? lookupLabel(DISTRICT_LABELS, opt) ?? lookupLabel(DIVISION_LABELS, opt) ?? opt;
      return (
        <SearchableSelect
          id={field.key}
          value={typeof value === "string" && value ? value : null}
          options={opts}
          labelFor={labelFor}
          disabled={disabled}
          onChange={(next) => onChange(next)}
        />
      );
    }
    case "date": {
      const dateValue = typeof value === "string" && value ? new Date(value) : undefined;
      const ageRule = field.rules?.find(
        (rule): rule is FieldDateRangeRule & { ageAsOf: string } => rule.kind === "dateRange" && Boolean(rule.ageAsOf)
      );
      const agePreview =
        ageRule && typeof value === "string" && value ? ageBetween(value, ageRule.ageAsOf) : null;
      return (
        <div className="grid gap-1.5">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  className="w-full justify-start font-normal"
                >
                  <IconCalendar className="mr-2 size-4" />
                  {dateValue ? dateValue.toLocaleDateString() : "Pick a date"}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(d) => onChange(d ? d.toISOString().slice(0, 10) : null)}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
          {agePreview && (
            <p className="text-xs text-muted-foreground">
              Will be {agePreview.years} year{agePreview.years === 1 ? "" : "s"}
              {agePreview.months > 0
                ? ` ${agePreview.months} month${agePreview.months === 1 ? "" : "s"}`
                : ""}{" "}
              old {ageRule?.ageLabel ?? ""}
            </p>
          )}
        </div>
      );
    }
    case "list": {
      const entries = Array.isArray(value) ? (value as string[]) : [];
      if (field.options && field.options.length > 0) {
        const selected = new Set(entries);
        return (
          <div className="grid gap-2 sm:grid-cols-2">
            {field.options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <Checkbox
                  disabled={disabled}
                  checked={selected.has(opt)}
                  onCheckedChange={(checked) =>
                    onChange(checked ? [...entries, opt] : entries.filter((e) => e !== opt))
                  }
                />
                {CATEGORY_OPTION_LABELS[opt] ?? opt}
              </label>
            ))}
          </div>
        );
      }
      return (
        <div className="grid gap-2">
          {entries.map((entry, index) => (
            <div key={`${field.key}-${index}`} className="flex gap-2">
              <Input
                value={entry ?? ""}
                disabled={disabled}
                onChange={(e) => {
                  const next = [...entries];
                  next[index] = e.target.value;
                  onChange(next);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={disabled}
                onClick={() => {
                  const next = entries.filter((_, i) => i !== index);
                  onChange(next);
                }}
              >
                <IconTrash className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onChange([...entries, ""])}
            className="w-fit"
          >
            <IconPlus className="mr-1 size-4" />
            Add entry
          </Button>
        </div>
      );
    }
    case "electoralYears": {
      const years = Array.isArray(value) ? (value as number[]) : [];
      const selected = new Set(years);
      return (
        <div className="flex flex-wrap gap-2">
          {electoralRegisterYears().map((year) => (
            <label
              key={year}
              className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm has-data-checked:border-primary"
            >
              <Checkbox
                disabled={disabled}
                checked={selected.has(year)}
                onCheckedChange={(checked) =>
                  onChange(checked ? [...years, year] : years.filter((y) => y !== year))
      }
              />
              {year}
            </label>
          ))}
        </div>
      );
    }
    case "map": {
      if (!field.mapConfig) {
        return null;
      }
      return (
        <NearbySchoolsField
          value={value}
          onChange={(next) => onChange(next)}
          disabled={disabled}
          homePoint={mapCenter ?? null}
          maxMarks={field.mapConfig.maxMarks}
          pointsPerSchool={field.mapConfig.pointsPerSchool}
          onNavigateToLocation={onNavigateToLocation}
        />
      );
    }
    case "file": {
      return (
        <Input
          id={field.key}
          type="text"
          placeholder="File reference"
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
    case "phone": {
      const phoneValue = value && typeof value === "object" && "e164" in value ? (value as PhoneNumberValue) : null;
      return (
        <PhoneNumberField
          id={field.key}
          value={phoneValue}
          disabled={disabled}
          onChange={(next) => onChange(next)}
        />
      );
    }
    default: {
      return null;
    }
  }
}

/**
 * A searchable `Select` \u2014 large option lists (GN divisions, electoral
 * districts) are unusable as a plain dropdown. `Combobox`'s `items` prop
 * doesn't filter itself, so the query is matched against each option's
 * display label here and only the matches are passed through.
 */
function SearchableSelect({
  id,
  value,
  options,
  labelFor,
  disabled,
  onChange,
}: {
  id?: string;
  value: string | null;
  options: string[];
  labelFor: (opt: string) => string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? options.filter((opt) => labelFor(opt).toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <Combobox
      items={filtered}
      itemToStringLabel={labelFor}
      value={value}
      disabled={disabled}
      onValueChange={(v) => onChange(v ?? "")}
    >
      <ComboboxTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-between font-normal"
          />
        }
      >
        <ComboboxValue placeholder="Select..." />
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput
          placeholder="Search..."
          showTrigger={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ComboboxEmpty>No results.</ComboboxEmpty>
        <ComboboxList>
          {filtered.map((opt) => (
            <ComboboxItem key={opt} value={opt}>
              {labelFor(opt)}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
