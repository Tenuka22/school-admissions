import type { AdmissionStepKey } from "@school-admissions/db/constants/admissionVersions/index";

/**
 * Display labels for each application step. The underlying step/field keys
 * stay "applicant" (renaming them would mean migrating every stored
 * application's data) — this is UI wording only. "Applicant" and "Guardian"
 * read as near-synonyms and are easy to mix up while filling the form, so
 * the child's own step is labelled "Child" here to keep it visually and
 * conceptually distinct from "Guardian".
 */
export const STEP_LABELS: Record<AdmissionStepKey, string> = {
  location: "Location",
  applicant: "Child",
  guardian: "Guardian",
  residence: "Residence",
  categories: "Categories",
  declaration: "Declaration",
  review: "Review",
};
