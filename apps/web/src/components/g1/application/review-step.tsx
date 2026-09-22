import type { AdmissionFieldDefinition } from "@school-admissions/db/constants/admissionVersions/index";
import { DISTRICT_LABELS, DIVISION_LABELS, lookupLabel } from "@school-admissions/db/constants/admissionVersions/index";
import type { MarkingCategoryDefinition, MarkingCategoryEntry } from "@school-admissions/db/constants/markingVersions/index";
import { scoreApplication } from "@school-admissions/db/constants/markingVersions/index";
import { Badge } from "@school-admissions/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@school-admissions/ui/components/card";
import { Separator } from "@school-admissions/ui/components/separator";

import { DOCUMENT_OPTION_LABELS } from "@/lib/g1/document-option-labels";
import { STEP_LABELS } from "@/lib/g1/step-labels";

export interface ReviewStepProps {
  fields: AdmissionFieldDefinition[];
  categories: MarkingCategoryDefinition[];
  data: Record<string, unknown>;
  entries: MarkingCategoryEntry[];
}

/** Read-only summary of every step's values plus the computed marking score. */
export function ReviewStep({ fields, categories, data, entries }: ReviewStepProps) {
  const score = scoreApplication(entries);
  const categoryByType = new Map<string, MarkingCategoryDefinition>(categories.map((c) => [c.type, c]));

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Marking score
            <Badge>{score.total} / 100</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {score.perEntry.map((entryScore, index) => (
            <div key={`${entryScore.categoryType}-${index}`} className="flex items-center justify-between text-sm">
              <span>
                {entryScore.categoryType} —{" "}
                {categoryByType.get(entryScore.categoryType)?.label ?? entryScore.categoryType}
              </span>
              <Badge variant="secondary">{entryScore.total} marks</Badge>
            </div>
          ))}
          {score.perEntry.length === 0 && (
            <p className="text-sm text-muted-foreground">No categories selected.</p>
          )}
        </CardContent>
      </Card>

      {["location", "applicant", "guardian", "residence", "declaration"].map((step) => {
        const stepFields = fields.filter((f) => f.step === step);
        if (stepFields.length === 0) {
          return null;
        }
        return (
          <Card key={step}>
            <CardHeader>
              <CardTitle>{STEP_LABELS[step as keyof typeof STEP_LABELS]}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1">
              {stepFields.map((field, index) => (
                <div key={field.key}>
                  {index > 0 && <Separator className="my-1" />}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{field.label}</span>
                    <span className="text-right font-medium">{formatValue(data[field.key], field)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatValue(value: unknown, field: AdmissionFieldDefinition): string {
  if (value === null || value === undefined || value === "") {
    return "\u2014";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "\u2014";
  }
  if (typeof value === "object" && "e164" in value && typeof value.e164 === "string") {
    return value.e164;
  }
  if (field.type === "select" && typeof value === "string") {
    return DOCUMENT_OPTION_LABELS[value] ?? lookupLabel(DISTRICT_LABELS, value) ?? lookupLabel(DIVISION_LABELS, value) ?? value;
  }
  return String(value);
}
