import type { AdmissionFieldDefinition } from "@school-admissions/db/constants/admissionVersions/index";
import {
  ADMISSION_STEPS,
  clearFieldAndDependents,
  getFieldsForSubversion,
  getSubversionModule,
  resolveFieldErrors,
  resolveFieldStates,
} from "@school-admissions/db/constants/admissionVersions/index";
import type { MarkingCategoryEntry } from "@school-admissions/db/constants/markingVersions/index";
import {
  getCategoriesForSubversion,
  getLatestMarkingSubversionNumber,
} from "@school-admissions/db/constants/markingVersions/index";
import { Badge } from "@school-admissions/ui/components/badge";
import { Button } from "@school-admissions/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@school-admissions/ui/components/card";
import { Progress } from "@school-admissions/ui/components/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconAlertCircle, IconCheck, IconDeviceFloppy, IconLock } from "@tabler/icons-react";
import { cn } from "cn";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { loadDraft, saveDraft, clearDraft } from "@/lib/g1/application-draft-storage";
import { STEP_LABELS } from "@/lib/g1/step-labels";
import { orpc } from "@/utils/orpc";

import { CategoryStep } from "./category-step";
import { LocationStep } from "./location-step";
import type { RenamedFieldInfo } from "./migration-banner";
import { MigrationBanner } from "./migration-banner";
import { ReviewStep } from "./review-step";
import { StepSection } from "./step-section";

/**
 * The residence step's "same as permanent" toggle mirrors the permanent
 * address into the current-address fields for as long as it holds \u2014
 * matching aloysius-g1's `normalizeDraft` behaviour \u2014 instead of just
 * hiding blank current-address fields the applicant never gets to fill in.
 */
function mirrorResidenceAddress(
  key: string,
  value: unknown,
  prev: Record<string, unknown>,
  next: Record<string, unknown>
): Record<string, unknown> {
  const sameAsPermanent = key === "sameAsPermanent" ? value : prev.sameAsPermanent;
  if (sameAsPermanent !== true) {
    return next;
  }
  return {
    ...next,
    currentAddressEn: key === "permanentAddressEn" ? value : (prev.permanentAddressEn ?? next.currentAddressEn),
    currentAddressSi: key === "permanentAddressSi" ? value : (prev.permanentAddressSi ?? next.currentAddressSi),
  };
}

export interface ApplicationFormApplication {
  id: string;
  applicationNumber: string;
  versionKey: string;
  currentSubversion: number;
  latestSubversion: number;
  status: string;
  data: Record<string, unknown> | null;
  updateNeeded: boolean;
  newFields: AdmissionFieldDefinition[];
  newlyRequired: AdmissionFieldDefinition[];
  removedFields: AdmissionFieldDefinition[];
  renamed: RenamedFieldInfo[];
}

export function ApplicationForm({ application }: { application: ApplicationFormApplication }) {
  const queryClient = useQueryClient();
  const [dirty, setDirty] = useState(false);

  // Always render against the LATEST subversion's fields/categories — saving
  // migrates the application there regardless of which subversion it was
  // last saved at (see `updateApplicationData`, which pins every save to
  // `getLatestSubversionNumber` and appends a version-log row when it bumps).
  const fields = getFieldsForSubversion(application.versionKey, application.latestSubversion) ?? [];
  const categories =
    getCategoriesForSubversion(application.versionKey, getLatestMarkingSubversionNumber(application.versionKey)) ?? [];
  const locationCapture = getSubversionModule(
    application.versionKey,
    application.latestSubversion
  )?.locationCapture;

  // This is a local-first form: the browser is the source of truth while
  // drafting (keyed by the application's own id), and nothing reaches the
  // server until Submit. A draft already on this device — or the server
  // already holding filled-in values from an earlier session — both count
  // as "continuing" a previously-started application.
  const initialDraft = useRef(loadDraft(application.id)).current;
  const wasContinued = useRef(
    Boolean(initialDraft) ||
      Object.values(application.data ?? {}).some((v) => v !== null && v !== undefined && v !== "")
  ).current;

  // Resuming a draft returns to the furthest step reached, not step 0 --
  // leaving mid-form and coming back shouldn't re-walk steps already done.
  const [stepIndex, setStepIndex] = useState(() => initialDraft?.stepIndex ?? 0);
  const [maxStepIndex, setMaxStepIndex] = useState(() => initialDraft?.maxStepIndex ?? 0);

  const [data, setData] = useState<Record<string, unknown>>(
    () => initialDraft?.data ?? { ...(application.data ?? {}) }
  );
  const [entries, setEntries] = useState<MarkingCategoryEntry[]>(
    () =>
      initialDraft?.entries ??
      (Array.isArray(application.data?.categories) ? (application.data.categories as MarkingCategoryEntry[]) : [])
  );

  // The applicant's own home location, captured in the Location step \u2014 lets the
  // categories step's map-proximity fields draw their radius/pins around a real
  // place instead of a disconnected list.
  const homeLatitude = typeof data[locationCapture?.latitudeField ?? ""] === "number" ? (data[locationCapture?.latitudeField ?? ""] as number) : null;
  const homeLongitude = typeof data[locationCapture?.longitudeField ?? ""] === "number" ? (data[locationCapture?.longitudeField ?? ""] as number) : null;
  const homePoint: [number, number] | null =
    homeLatitude !== null && homeLongitude !== null && Number.isFinite(homeLatitude) && Number.isFinite(homeLongitude)
      ? [homeLatitude, homeLongitude]
      : null;

  // Field edits go through functional `setState` updaters (never a captured
  // `data`/`entries` snapshot) because the location step applies a patch
  // twice — once immediately, once after an `await` (reverse geocoding) —
  // and a snapshot-based merge would silently drop the first patch once the
  // second one lands. `saveDraft` runs inside the updater so it always
  // persists the value that was actually just committed to state.
  const updateData = (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => {
    setDirty(true);
    setData((prev) => {
      const next = updater(prev);
      saveDraft(application.id, { data: next, entries, stepIndex, maxStepIndex });
      return next;
    });
  };
  const updateEntries = (updater: (prev: MarkingCategoryEntry[]) => MarkingCategoryEntry[]) => {
    setDirty(true);
    setEntries((prev) => {
      const next = updater(prev);
      saveDraft(application.id, { data, entries: next, stepIndex, maxStepIndex });
      return next;
    });
  };

  const submitMutation = useMutation(
    orpc.admissions.updateApplicationData.mutationOptions({
      onSuccess: () => {
        toast.success(application.status === "draft" ? "Application submitted" : "Changes saved");
        clearDraft(application.id);
        setDirty(false);
        queryClient.invalidateQueries({
          queryKey: orpc.admissions.getApplication.queryKey({ input: { id: application.id } }),
        });
      },
      onError: (error) => toast.error(error.message),
    })
  );

  // Editing stays open through "draft" (never submitted) and "submitted"
  // (submitted, not yet picked up for review) \u2014 once an admin moves it into
  // review or decides it, further applicant edits would silently undo that
  // review state, so only those statuses lock the form (matches the same
  // rule `updateApplicationData` enforces server-side).
  const isLocked = application.status !== "draft" && application.status !== "submitted";
  const alreadySubmitted = application.status !== "draft";
  const highlightKeys = new Set(application.newFields.map((f) => f.key));

  const saveLocally = () => {
    saveDraft(application.id, { data, entries, stepIndex, maxStepIndex });
    setDirty(false);
    toast.success("Progress saved on this device");
  };

  const submit = () => {
    submitMutation.mutate({ id: application.id, data: { ...data, categories: entries } });
  };

  const step = ADMISSION_STEPS[stepIndex] ?? "review";
  const stepFields = fields.filter((f) => f.step === step);
  const states = resolveFieldStates(fields, data);
  const fieldErrors = resolveFieldErrors(fields, data);
  const stepIncomplete = stepFields.some(
    (f) =>
      (f.required && !states[f.key]?.disabled && isEmptyValue(data[f.key])) ||
      Boolean(fieldErrors[f.key])
  );

  // A step is complete when every required, non-disabled field of ITS OWN
  // fields (not the whole form) is filled and error-free \u2014 reused both to
  // mark step tabs and to gate how far forward a tab click can jump.
  const isStepComplete = (key: (typeof ADMISSION_STEPS)[number]) =>
    !fields
      .filter((f) => f.step === key)
      .some(
        (f) =>
          (f.required && !states[f.key]?.disabled && isEmptyValue(data[f.key])) ||
          Boolean(fieldErrors[f.key])
      );

  // The furthest step index reachable by jumping ahead: the first
  // incomplete step in order, or the last step if every earlier one is
  // done. Tab clicks (and Next) can never skip past an incomplete step —
  // only Previous, or clicking a step already at/behind this index, works.
  let furthestAllowedIndex = ADMISSION_STEPS.length - 1;
  for (let i = 0; i < ADMISSION_STEPS.length; i += 1) {
    if (!isStepComplete(ADMISSION_STEPS[i])) {
      furthestAllowedIndex = i;
      break;
    }
  }
  const isStepReachable = (index: number) => index <= Math.max(furthestAllowedIndex, stepIndex, maxStepIndex);

  // `updateApplicationData` rejects the save unless every required field of
  // the latest subversion is filled (it persists a full snapshot, not a
  // partial diff) — gate Submit on the same rule so it never fires a doomed
  // request.
  const missingRequired = fields.filter(
    (f) => f.required && !states[f.key]?.disabled && isEmptyValue(data[f.key])
  );
  const canSubmit = missingRequired.length === 0 && Object.keys(fieldErrors).length === 0;

  // Save only exists at all once there's something worth protecting: you've
  // gone back to a step you already passed, or you're continuing an
  // already-started draft. A brand-new, first-time-through application has
  // nothing to protect — Next alone persists it locally — so Save never
  // renders for that case. Once eligible, the button stays mounted but is
  // disabled until there's an actual unsaved edit, and re-disables itself
  // right after a save.
  const canSave = stepIndex < maxStepIndex || wasContinued;

  const goToStep = (index: number) => {
    if (!isStepReachable(index)) {
      return;
    }
    const nextMax = Math.max(maxStepIndex, index);
    setStepIndex(index);
    setMaxStepIndex(nextMax);
    saveDraft(application.id, { data, entries, stepIndex: index, maxStepIndex: nextMax });
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{application.applicationNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Version {application.versionKey}.{application.currentSubversion}
          </p>
        </div>
        <Badge variant={application.status === "draft" ? "secondary" : "default"}>
          {application.status}
        </Badge>
      </div>

      {application.updateNeeded && (
        <MigrationBanner
          currentSubversion={application.currentSubversion}
          latestSubversion={application.latestSubversion}
          newFields={fields.filter((f) => highlightKeys.has(f.key))}
          newlyRequired={fields.filter((f) =>
            application.newlyRequired.some((n) => n.key === f.key)
          )}
          removedFields={application.removedFields}
          renamed={application.renamed}
        />
      )}

      <Progress value={((stepIndex + 1) / ADMISSION_STEPS.length) * 100} />
      <div className="flex flex-wrap gap-1">
        {ADMISSION_STEPS.map((key, index) => {
          const reachable = isStepReachable(index);
          const visited = index <= maxStepIndex;
          const complete = isStepComplete(key);
          return (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={index === stepIndex ? "default" : "outline"}
              disabled={!reachable}
              onClick={() => goToStep(index)}
              className={cn(
                "gap-1.5",
                !reachable && "opacity-60",
                visited && !complete && index !== stepIndex && "border-amber-500/50 text-amber-600 dark:text-amber-400"
              )}
            >
              {!reachable ? (
                <IconLock className="size-3 shrink-0" />
              ) : visited && complete ? (
                <IconCheck className="size-3.5 shrink-0 text-emerald-500" />
              ) : visited && !complete && index !== stepIndex ? (
                <IconAlertCircle className="size-3.5 shrink-0 text-amber-500" />
              ) : null}
              {STEP_LABELS[key]}
            </Button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEP_LABELS[step]}</CardTitle>
          <CardDescription>
            Step {stepIndex + 1} of {ADMISSION_STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "categories" ? (
            <CategoryStep
              categories={categories}
              entries={entries}
              onChange={(nextEntries) => updateEntries(() => nextEntries)}
              homePoint={homePoint}
              onNavigateToLocation={() => goToStep(0)}
              disabled={isLocked}
            />
          ) : step === "review" ? (
            <ReviewStep fields={fields} categories={categories} data={data} entries={entries} />
          ) : step === "location" && locationCapture ? (
            <LocationStep
              config={locationCapture}
              data={data}
              disabled={isLocked}
              onChange={(patch) => updateData((prev) => ({ ...prev, ...patch }))}
            />
          ) : (
            <StepSection
              allFields={fields}
              stepFields={stepFields}
              data={data}
              errors={fieldErrors}
              highlightKeys={highlightKeys}
              disabled={isLocked}
              onFieldChange={(key, value) =>
                updateData((prev) => {
                  const next = { ...clearFieldAndDependents(fields, key, prev), [key]: value };
                  return mirrorResidenceAddress(key, value, prev, next);
                })
              }
            />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={stepIndex === 0}
          onClick={() => goToStep(Math.max(0, stepIndex - 1))}
        >
          Previous
        </Button>
        <div className="flex gap-2">
          {canSave && !isLocked && (
            <Button type="button" variant="secondary" disabled={!dirty} onClick={saveLocally}>
              <IconDeviceFloppy className="mr-1 size-4" />
              Save
            </Button>
          )}
          {stepIndex < ADMISSION_STEPS.length - 1 ? (
            <Button type="button" disabled={stepIncomplete} onClick={() => goToStep(stepIndex + 1)}>
              Next
            </Button>
          ) : isLocked ? null : !alreadySubmitted ? (
            <Button
              type="button"
              disabled={submitMutation.isPending || !canSubmit}
              onClick={submit}
              className={cn(
                canSubmit && !submitMutation.isPending && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
                !canSubmit && "border-amber-500/60 bg-amber-500/10 text-amber-600 disabled:opacity-100 dark:text-amber-400"
              )}
            >
              <IconCheck className="mr-1 size-4" />
              {submitMutation.isPending
                ? "Submitting..."
                : canSubmit
                  ? "Submit"
                  : `Submit (${missingRequired.length} required left)`}
            </Button>
          ) : (
            // Already submitted: never show "Submit" again (there's nothing left
            // to submit) \u2014 only a "Save edit" that's enabled once something in
            // the form actually changed since the last save.
            <Button
              type="button"
              disabled={submitMutation.isPending || !canSubmit || !dirty}
              onClick={submit}
              className={cn(
                dirty && canSubmit && !submitMutation.isPending && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
                dirty && !canSubmit && "border-amber-500/60 bg-amber-500/10 text-amber-600 disabled:opacity-100 dark:text-amber-400"
              )}
            >
              <IconDeviceFloppy className="mr-1 size-4" />
              {submitMutation.isPending ? "Saving..." : "Save edit"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}
