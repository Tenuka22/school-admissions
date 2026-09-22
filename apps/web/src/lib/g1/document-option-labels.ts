/**
 * Friendly display labels for residence-document option values used by the
 * marking scheme's "Main Residence Document" / "Residence Document" select
 * fields (categories 6.1 and 6.3).
 *
 * These raw values say "applicant" and "parents", but the form's "Applicant"
 * step is the child's own details — the deed options actually refer to the
 * *guardian* filling in the form (and the guardian's own parents, i.e. the
 * child's grandparents). Left unclarified, applicants read "applicant" here
 * as the child and pick the wrong document. This map only changes what's
 * displayed; the underlying option values (and the scoring tables keyed by
 * them) are untouched.
 */
export const DOCUMENT_OPTION_LABELS: Record<string, string> = {
  "title-deed-applicant": "Title Deed in Guardian's Name",
  "title-deed-applicant-spouse": "Title Deed in Guardian's or Spouse's Name",
  "title-deed-parents": "Title Deed in Guardian's Parents' Name (Child's Grandparents)",
};
