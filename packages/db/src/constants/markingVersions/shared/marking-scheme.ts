/**
 * G1 2027 Marking Scheme - single source of truth for all scoring constants.
 *
 * 100% port of the source `aloysius-g1` project's
 * `apps/web/src/lib/g1/marking-scheme.ts` + `scoring.ts` lookup tables.
 * Every numeric value used in scoring references this file.
 */

import { INTAKE_YEAR_DEFAULT } from "./intake-year";

// ── Global ───────────────────────────────────────────────────────────────────

export const CATEGORY_MAX_MARKS = 100;

/** Radius (km) within which nearby schools are counted on the map. */
export const SCHOOLS_RADIUS_KM = 10;

// ── Electoral Register (shared) ──────────────────────────────────────────────

/** Number of electoral-register years scored (2.5/2 marks per person-year). */
export const ELECTORAL_REGISTER_YEAR_COUNT = 5;

/**
 * The scored window is always the 5 register years ending two years before
 * the intake year — e.g. the 2027 intake scores 2021-2025. Derived from the
 * intake year so the window advances every admission cycle.
 */
export const electoralRegisterYears = (
  intakeYear: string | number = INTAKE_YEAR_DEFAULT
): number[] => {
  const year =
    typeof intakeYear === "string"
      ? Math.trunc(Number(intakeYear))
      : intakeYear;
  const endYear = Number.isFinite(year)
    ? year - 2
    : Math.trunc(Number(INTAKE_YEAR_DEFAULT)) - 2;
  return Array.from(
    { length: ELECTORAL_REGISTER_YEAR_COUNT },
    (_, i) => endYear - ELECTORAL_REGISTER_YEAR_COUNT + 1 + i
  );
};

// ── 6.1 - Residence Verification & Proximity ─────────────────────────────────

export const MAIN_DOCUMENT_MAX_61 = 20;

export const ADDITIONAL_DOC_MARKS_PER = 1;
export const ADDITIONAL_DOC_MAX_61 = 5;

export const ELECTORAL_MARKS_PER_PERSON_YEAR_61 = 2.5;
export const ELECTORAL_MAX_61 = 25;

export const PROXIMITY_PER_SCHOOL_61 = 5;
export const PROXIMITY_MAX_61 = 50;

export const DEED_AGE_WEIGHTS: { minYears: number; weight: number }[] = [
  { minYears: 5, weight: 1 },
  { minYears: 4, weight: 0.8 },
  { minYears: 3, weight: 0.6 },
  { minYears: 2, weight: 0.4 },
  { minYears: 1, weight: 0.2 },
  { minYears: 0.5, weight: 0.1 },
];
export const DEED_AGE_MIN_WEIGHT = 0.05;

export const MAIN_DOCUMENT_MARKS_61: Record<string, number> = {
  "title-deed-applicant": 20,
  "title-deed-parents": 16,
  "feeder-electoral-5yrs": 15,
  "lease-deed": 10,
  "municipal-ds-certificate": 5,
  "other-documents": 4,
};

// ── 6.2 - Alumni ─────────────────────────────────────────────────────────────

export const YEARS_EDUCATED_MARKS_PER_YEAR = 2;
export const YEARS_EDUCATED_MAX_YEARS = 13;
export const YEARS_EDUCATED_MAX = 26;

export const GRADE5_SCHOLARSHIP_MARKS = 3;

export const OL_MAX_MARKS = 10;
export const AL_MAX_MARKS = 12;
export const EDUCATIONAL_TOTAL_MAX = 25;

export const SPORTS_MAX = 10;
export const LEADERSHIP_MAX = 5;
export const STUDENT_SOCIETIES_MAX = 5;
export const OTHER_ACTIVITIES_MAX = 5;

export const PAST_PUPILS_LIFE_MEMBER_MARKS_PER_YEAR = 1;
export const PAST_PUPILS_LIFE_MEMBER_MAX = 10;
export const PAST_PUPILS_YEARLY_MARKS = 0.5;
export const PAST_PUPILS_MEMBERSHIP_MAX = 10;
export const PAST_PUPILS_COMMITTEE_MARKS_PER_YEAR = 0.25;
export const PAST_PUPILS_EXECUTIVE_MARKS = 1.5;
export const PAST_PUPILS_EXECUTIVE_COUNT = 2;
export const PAST_PUPILS_COMMITTEE_EXECUTIVE_MAX = 3;
export const PAST_PUPILS_TOTAL_MAX = 13;

export const DEGREE_MAX = 5;
export const DIPLOMA_MARKS = 2;

export const CARNIVAL_CONTRIBUTION = 0.5;
export const SHRAMADANA_CONTRIBUTION = 0.5;
export const CONTRIBUTION_MAX = 2;
export const SCHOOL_PROJECTS_MARKS = 4;

export const SPORTS_LEVEL_MARKS: Record<string, number> = {
  "inter-house": 0.5,
  zonal: 1,
  district: 2,
  provincial: 3,
  national: 4.75,
  international: 5,
};

export const LEADERSHIP_ROLE_MARKS: Record<string, number> = {
  "prefect-primary": 1,
  "prefect-junior": 1.5,
  "prefect-senior": 3,
  "deputy-head-prefect": 4,
  "head-prefect": 5,
  "first-team-vice-captain": 1.5,
  "first-team-captain": 2,
};

export const STUDENT_SOCIETIES_ROLE_MARKS: Record<string, number> = {
  "committee-member": 0.5,
  "vice-president": 0.75,
  president: 1,
};

export const OTHER_ACTIVITY_MARKS: Record<string, number> = {
  "junior-band-leader": 2,
  "junior-band-member": 1,
  "senior-band-leader": 2,
  "senior-band-member": 1,
  "scout-leader": 2,
  "scout-member": 1,
  "cub-scout": 1,
  "cadet-team-leader": 2,
  "cadet-team-member": 1,
  "debating-team-leader": 2,
  "debating-team-member": 1,
  "st-john-ambulance-leader": 2,
  "st-john-ambulance-member": 1,
  other: 1,
};

export const DEGREE_MARKS: Record<string, number> = {
  "first-degree": 3,
  postgraduate: 4,
  doctorate: 5,
  "chartered-professional": 3,
};

/** O/L grade-rate ceilings per subject count: [grade → ceiling marks]. */
export const OL_CEILINGS: Record<number, Record<string, number>> = {
  6: { S: 4, C: 8, B: 10, A: 0 },
  8: { S: 4, C: 8, B: 10, A: 0 },
  9: { S: 4, C: 6, B: 8, A: 10 },
  10: { S: 4, C: 8, B: 0, A: 10 },
};

/** A/L grade-rate ceilings per subject count. */
export const AL_CEILINGS: Record<number, Record<string, number>> = {
  3: { S: 6, C: 8, B: 10, A: 12 },
  4: { S: 6, C: 8, B: 10, A: 12 },
};

// ── 6.3 - Siblings ───────────────────────────────────────────────────────────

export const SIBLING_MARKS_PER_GRADE = 2;
export const SIBLING_MAX_GRADES = 10;
export const SIBLING_GRADES_MAX = 20;

export const SIBLING_STUDIED_HERE_MARKS = 5;
export const SIBLING_MULTIPLE_STUDYING_MARKS = 5;

export const SIBLING_SPORTS_MAX = 2;
export const SIBLING_EXAM_MAX = 2;
export const SIBLING_LEADERSHIP_MARKS = 2;
export const SIBLING_SUPPORT_MARKS = 4;
export const SIBLING_COCURRICULAR_TOTAL_MAX = 10;

export const SIBLING_SPORTS_LEVEL_MARKS: Record<string, number> = {
  "inter-house": 0.25,
  zonal: 0.5,
  district: 1,
  provincial: 1.5,
  national: 1.75,
  international: 2,
};

export const SIBLING_EXAM_MARKS: Record<string, number> = {
  scholarship: 0.5,
  ol: 1,
  al: 1.5,
};

export const MAIN_DOCUMENT_MAX_63 = 10;

export const ELECTORAL_MARKS_PER_PERSON_YEAR_63 = 2;
export const ELECTORAL_MAX_63 = 20;

export const PROXIMITY_PER_SCHOOL_63 = 3;
export const PROXIMITY_MAX_63 = 30;

export const MAIN_DOCUMENT_MARKS_63: Record<string, number> = {
  "title-deed-applicant-spouse": 10,
  "title-deed-parents": 6,
  "feeder-electoral-5yrs": 6,
  "lease-deed": 4,
  "municipal-ds-rentact-cert": 4,
  "other-documents": 2,
};

// ── 6.4 - Education Sector / Teaching Staff ──────────────────────────────────

export const SERVICE_PERIOD_MAX = 20;

export const DIFFICULT_SERVICE_CURRENT_RATE = 5;
export const DIFFICULT_SERVICE_PREVIOUS_RATE = 3;
export const DIFFICULT_SERVICE_YEARS_CAP = 5;
export const DIFFICULT_SERVICE_MAX = 25;

/** [minKm, ratePerYear, tierCapMarks]. */
export const DIFFICULT_DISTANCE_RATE_TIERS: [number, number, number][] = [
  [150, 3, 15],
  [100, 2, 10],
  [75, 1, 5],
];

export const DIFFICULT_SERVICE_BONUS_MIN_MONTHS = 6;

export const UNUTILIZED_LEAVE_MARKS_PER_YEAR = 2;
export const UNUTILIZED_LEAVE_MAX_YEARS = 5;
export const UNUTILIZED_LEAVE_MAX = 10;

export const CONTRIBUTION_PATH1_SAME_SCHOOL_RATE = 2;
export const CONTRIBUTION_PATH1_ELSEWHERE_RATE = 1.5;
export const CONTRIBUTION_PATH1_YEARS_CAP = 5;
export const CONTRIBUTION_PATH1_SAME_SCHOOL_MAX = 10;
export const CONTRIBUTION_PATH1_ELSEWHERE_MAX = 7.5;

export const CONTRIBUTION_PATH2_RATE_PER_ITEM = 0.5;
export const CONTRIBUTION_PATH2_YEARS_CAP = 5;
export const CONTRIBUTION_PATH2_ITEM_MAX = 2.5;

export const SCHOOL_EDUCATION_CONTRIBUTION_MAX = 10;

/** [maxKm, marks]. */
export const RESIDENCE_DISTANCE_TIERS_64: [number, number][] = [
  [1, 10],
  [3, 8],
  [5, 6],
];
export const RESIDENCE_DISTANCE_FALLBACK_64 = 4;
export const RESIDENCE_DISTANCE_MAX_64 = 10;

/** [minKm, marks]. */
export const WORKPLACE_DISTANCE_TIERS: [number, number][] = [
  [100, 25],
  [70, 20],
  [40, 15],
  [20, 10],
];
export const WORKPLACE_DISTANCE_FALLBACK = 5;
export const WORKPLACE_DISTANCE_MAX = 25;

// ── 6.5 - Transfer Applications ──────────────────────────────────────────────

/** [minKm, marks]. */
export const TRANSFER_DISTANCE_TIERS: [number, number][] = [
  [150, 35],
  [100, 28],
  [50, 21],
];
export const TRANSFER_DISTANCE_MIN_KM = 50;
export const TRANSFER_SERVICE_PERIOD_MAX = 10;

/** [minYears, marks]. */
export const TRANSFER_PREVIOUS_PERIOD_TIERS: [number, number][] = [
  [3, 10],
  [2, 8],
  [1, 5],
];
export const TRANSFER_PREVIOUS_PERIOD_MAX = 10;

/** [maxYears, marks]. */
export const TRANSFER_ELAPSED_TIERS: [number, number][] = [
  [1, 5],
  [2, 4],
  [3, 3],
  [4, 2],
  [5, 1],
];
export const TRANSFER_ELAPSED_MAX = 5;

export const PROXIMITY_PER_SCHOOL_65 = 3;
export const PROXIMITY_MAX_65 = 30;
export const TRANSFER_DISTANCE_MAX = 35;

// ── 6.6 - Foreign Employment ─────────────────────────────────────────────────

/** [minYears, marks]. */
export const ABROAD_PERIOD_TIERS: [number, number][] = [
  [3, 25],
  [2, 15],
  [1, 10],
];
export const ABROAD_PERIOD_MAX = 25;

export const EMPLOYMENT_PURPOSE_MARKS: Record<string, number> = {
  diplomatic: 40,
  government: 40,
  education: 30,
  employment: 25,
};
export const EMPLOYMENT_PURPOSE_MAX = 40;

export const PROXIMITY_PER_SCHOOL_66 = 3.5;
export const PROXIMITY_MAX_66 = 35;
