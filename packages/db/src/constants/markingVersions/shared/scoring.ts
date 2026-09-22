/**
 * G1 marking scoring — 100% port of the source `aloysius-g1` project's
 * `apps/web/src/lib/g1/scoring.ts` formulas. Every function is pure over the
 * entry inputs; the map/proximity input (`schoolsWithinRadius`) is the list
 * of school ids found inside the applicant's map circle, and each category
 * DEDUCTS marks per school from its proximity ceiling.
 */

import {
  ABROAD_PERIOD_MAX,
  ABROAD_PERIOD_TIERS,
  ADDITIONAL_DOC_MARKS_PER,
  ADDITIONAL_DOC_MAX_61,
  AL_CEILINGS,
  AL_MAX_MARKS,
  CARNIVAL_CONTRIBUTION,
  CATEGORY_MAX_MARKS,
  CONTRIBUTION_MAX,
  CONTRIBUTION_PATH1_ELSEWHERE_RATE,
  CONTRIBUTION_PATH1_SAME_SCHOOL_RATE,
  CONTRIBUTION_PATH1_YEARS_CAP,
  CONTRIBUTION_PATH2_ITEM_MAX,
  CONTRIBUTION_PATH2_RATE_PER_ITEM,
  DEED_AGE_MIN_WEIGHT,
  DEED_AGE_WEIGHTS,
  DEGREE_MARKS,
  DEGREE_MAX,
  DIFFICULT_DISTANCE_RATE_TIERS,
  DIFFICULT_SERVICE_BONUS_MIN_MONTHS,
  DIFFICULT_SERVICE_CURRENT_RATE,
  DIFFICULT_SERVICE_MAX,
  DIFFICULT_SERVICE_PREVIOUS_RATE,
  DIFFICULT_SERVICE_YEARS_CAP,
  DIPLOMA_MARKS,
  ELECTORAL_MARKS_PER_PERSON_YEAR_61,
  ELECTORAL_MARKS_PER_PERSON_YEAR_63,
  ELECTORAL_MAX_61,
  ELECTORAL_MAX_63,
  EMPLOYMENT_PURPOSE_MARKS,
  EMPLOYMENT_PURPOSE_MAX,
  GRADE5_SCHOLARSHIP_MARKS,
  LEADERSHIP_MAX,
  LEADERSHIP_ROLE_MARKS,
  MAIN_DOCUMENT_MARKS_61,
  MAIN_DOCUMENT_MARKS_63,
  MAIN_DOCUMENT_MAX_61,
  MAIN_DOCUMENT_MAX_63,
  OL_CEILINGS,
  OL_MAX_MARKS,
  OTHER_ACTIVITY_MARKS,
  OTHER_ACTIVITIES_MAX,
  PAST_PUPILS_COMMITTEE_EXECUTIVE_MAX,
  PAST_PUPILS_COMMITTEE_MARKS_PER_YEAR,
  PAST_PUPILS_EXECUTIVE_COUNT,
  PAST_PUPILS_EXECUTIVE_MARKS,
  PAST_PUPILS_LIFE_MEMBER_MARKS_PER_YEAR,
  PAST_PUPILS_LIFE_MEMBER_MAX,
  PAST_PUPILS_MEMBERSHIP_MAX,
  PAST_PUPILS_TOTAL_MAX,
  PAST_PUPILS_YEARLY_MARKS,
  PROXIMITY_MAX_61,
  PROXIMITY_MAX_63,
  PROXIMITY_MAX_65,
  PROXIMITY_MAX_66,
  PROXIMITY_PER_SCHOOL_61,
  PROXIMITY_PER_SCHOOL_63,
  PROXIMITY_PER_SCHOOL_65,
  PROXIMITY_PER_SCHOOL_66,
  RESIDENCE_DISTANCE_FALLBACK_64,
  RESIDENCE_DISTANCE_MAX_64,
  RESIDENCE_DISTANCE_TIERS_64,
  SCHOOL_EDUCATION_CONTRIBUTION_MAX,
  SCHOOL_PROJECTS_MARKS,
  SERVICE_PERIOD_MAX,
  SIBLING_COCURRICULAR_TOTAL_MAX,
  SIBLING_EXAM_MARKS,
  SIBLING_EXAM_MAX,
  SIBLING_GRADES_MAX,
  SIBLING_LEADERSHIP_MARKS,
  SIBLING_MARKS_PER_GRADE,
  SIBLING_MULTIPLE_STUDYING_MARKS,
  SIBLING_SPORTS_LEVEL_MARKS,
  SIBLING_SPORTS_MAX,
  SIBLING_STUDIED_HERE_MARKS,
  SIBLING_SUPPORT_MARKS,
  SHRAMADANA_CONTRIBUTION,
  SPORTS_LEVEL_MARKS,
  SPORTS_MAX,
  STUDENT_SOCIETIES_MAX,
  STUDENT_SOCIETIES_ROLE_MARKS,
  TRANSFER_DISTANCE_MAX,
  TRANSFER_DISTANCE_TIERS,
  TRANSFER_ELAPSED_MAX,
  TRANSFER_ELAPSED_TIERS,
  TRANSFER_PREVIOUS_PERIOD_MAX,
  TRANSFER_PREVIOUS_PERIOD_TIERS,
  TRANSFER_SERVICE_PERIOD_MAX,
  UNUTILIZED_LEAVE_MARKS_PER_YEAR,
  UNUTILIZED_LEAVE_MAX,
  WORKPLACE_DISTANCE_FALLBACK,
  WORKPLACE_DISTANCE_MAX,
  WORKPLACE_DISTANCE_TIERS,
  YEARS_EDUCATED_MARKS_PER_YEAR,
  YEARS_EDUCATED_MAX,
  electoralRegisterYears,
} from "./marking-scheme";
import type { MarkingCategoryEntry, MarkingCategoryType } from "./types";

export interface ScoreRow {
  label: string;
  marks: number;
  max: number;
}
export interface CategoryScore {
  categoryType: string;
  total: number;
  breakdown: ScoreRow[];
}

const round2 = (value: number): number => Math.round(value * 100) / 100;
const cap = (value: number, max: number): number =>
  round2(Math.max(0, Math.min(value, max)));

type Inputs = Record<string, unknown>;

const str = (inputs: Inputs, key: string): string | undefined => {
  const value = inputs[key];
  return typeof value === "string" ? value : undefined;
};
const num = (inputs: Inputs, key: string): number | undefined => {
  const value = inputs[key];
  return typeof value === "number" ? value : undefined;
};
const bool = (inputs: Inputs, key: string): boolean | undefined => {
  const value = inputs[key];
  return typeof value === "boolean" ? value : undefined;
};

/** Reads a list field holding structured entries like `{ levels: [...] }`;
 * non-object junk values are ignored (mirrors g1's entry lists). */
const listOf = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null && !Array.isArray(item)
      )
    : [];

/** Reads a list field holding plain option strings (e.g. leadership roles);
 * non-string junk values are ignored (mirrors g1's option lists). */
const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

/** Sums the mark-table values for every string in a list of option arrays. */
const sumTableMarks = (
  entries: Record<string, unknown>[],
  key: string,
  table: Record<string, number>
): number =>
  entries.reduce(
    (sum, entry) =>
      sum +
      (Array.isArray(entry[key])
        ? (entry[key] as unknown[]).reduce<number>(
            (s, level) => s + (table[String(level)] ?? 0),
            0
          )
        : 0),
    0
  );

/** G.C.E. O/L + A/L grade-rate scoring shared shape: per-grade counts ×
 * (ceiling / subject count), capped at the exam's maximum. */
const examGradeMarks = (
  inputs: Inputs,
  subjectCountKey: string,
  gradePrefix: string,
  ceilings: Record<number, Record<string, number>>,
  maxMarks: number
): number => {
  const count = num(inputs, subjectCountKey);
  const table = count === undefined ? undefined : ceilings[count];
  if (count === undefined || !table) {
    return 0;
  }
  let marks = 0;
  for (const grade of ["S", "C", "B", "A"]) {
    const gradeCount = num(inputs, `${gradePrefix}Grade${grade}`) ?? 0;
    marks += gradeCount * ((table[grade] ?? 0) / count);
  }
  return cap(marks, maxMarks);
};

// ─── Date helpers ────────────────────────────────────────────────────────────

export const yearsFromDate = (dateStr: string | undefined): number => {
  if (!dateStr) {
    return 0;
  }
  const start = new Date(dateStr);
  if (Number.isNaN(start.getTime())) {
    return 0;
  }
  const now = new Date();
  return round2(
    Math.max(
      0,
      (now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )
  );
};

/** Whole completed years elapsed since `dateStr` — calendar anniversary
 * arithmetic, used for "1 mark per completed year" scoring. */
export const wholeYearsFromDate = (dateStr: string | undefined): number => {
  if (!dateStr) {
    return 0;
  }
  const start = new Date(dateStr);
  if (Number.isNaN(start.getTime())) {
    return 0;
  }
  const now = new Date();
  if (start.getTime() > now.getTime()) {
    return 0;
  }
  let years = now.getUTCFullYear() - start.getUTCFullYear();
  const startMonthDay = start.getUTCMonth() * 100 + start.getUTCDate();
  const nowMonthDay = now.getUTCMonth() * 100 + now.getUTCDate();
  if (nowMonthDay < startMonthDay) {
    years -= 1;
  }
  return Math.max(0, years);
};

export const yearsBetween = (
  d1: string | undefined,
  d2: string | undefined
): number => {
  if (!d1 || !d2) {
    return 0;
  }
  const a = new Date(d1);
  const b = new Date(d2);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return 0;
  }
  return Math.max(
    0,
    Math.abs(b.getTime() - a.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
};

/** Whole years + remaining months between two dates (calendar arithmetic). */
export const yearsAndMonthsBetween = (
  startDate: string | undefined,
  endDate?: string
): { years: number; remainderMonths: number } => {
  if (!startDate) {
    return { years: 0, remainderMonths: 0 };
  }
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.getTime() > end.getTime()
  ) {
    return { years: 0, remainderMonths: 0 };
  }
  let totalMonths =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) {
    totalMonths -= 1;
  }
  totalMonths = Math.max(0, totalMonths);
  return {
    years: Math.floor(totalMonths / 12),
    remainderMonths: totalMonths % 12,
  };
};

/** Counts checked years inside the current scored electoral window. */
export const electoralYearsRegistered = (checkedYears: unknown): number => {
  if (!Array.isArray(checkedYears) || checkedYears.length === 0) {
    return 0;
  }
  const validYears = new Set(electoralRegisterYears());
  return checkedYears.filter(
    (year) => typeof year === "number" && validYears.has(year)
  ).length;
};

export const deedAgeWeight = (years: number | undefined): number => {
  if (years === undefined) {
    return 1;
  }
  for (const { minYears, weight } of DEED_AGE_WEIGHTS) {
    if (years >= minYears) {
      return weight;
    }
  }
  return DEED_AGE_MIN_WEIGHT;
};

// ─── Map / proximity ─────────────────────────────────────────────────────────

/**
 * MAP FIELD DEDUCTION \u2014 `schoolsWithinRadius` holds the ids of every
 * gender-compatible catalog school at least as close to the applicant's
 * home as the school they're applying to (see `compatibleSchoolsWithinRadius`
 * in `@school-admissions/db/constants/schools` \u2014 the radius is the
 * applicant's real home-to-school distance, never a fixed config number).
 * Proximity is a scarcity/priority criterion: FEWER competing nearby schools
 * means fewer alternatives, so the category starts at `max` and DEDUCTS
 * `perSchool` marks per school found, floored at 0.
 */
export const proximityMarks = (
  inputs: Inputs,
  perSchool: number,
  max: number
): number => {
  const schools = inputs.schoolsWithinRadius;
  const count = Array.isArray(schools) ? schools.length : 0;
  return cap(max - count * perSchool, max);
};

// ─── 6.1 - Residence Verification & Proximity ────────────────────────────────

export const documentMarks61 = (inputs: Inputs): number => {
  const documentMax =
    MAIN_DOCUMENT_MARKS_61[str(inputs, "mainDocumentType") ?? ""];
  const deedYears = yearsFromDate(str(inputs, "deedTransferDate"));
  return documentMax === undefined
    ? 0
    : cap(documentMax * deedAgeWeight(deedYears), MAIN_DOCUMENT_MAX_61);
};

export const additionalDocsMarks61 = (inputs: Inputs): number => {
  const docs = inputs.additionalDocs;
  const count = Array.isArray(docs) ? docs.length : 0;
  return cap(count * ADDITIONAL_DOC_MARKS_PER, ADDITIONAL_DOC_MAX_61);
};

const electoralRegisterMarks61 = (inputs: Inputs): number => {
  const mother = electoralYearsRegistered(inputs.electoralMotherYears);
  const father = electoralYearsRegistered(inputs.electoralFatherYears);
  return cap(
    (mother + father) * ELECTORAL_MARKS_PER_PERSON_YEAR_61,
    ELECTORAL_MAX_61
  );
};

export const electoralMarks61 = (inputs: Inputs): number =>
  electoralRegisterMarks61(inputs);

export const proximityMarks61 = (inputs: Inputs): number =>
  proximityMarks(inputs, PROXIMITY_PER_SCHOOL_61, PROXIMITY_MAX_61);

export const scoreCategory61 = (inputs: Inputs): CategoryScore => {
  const documentMarks = documentMarks61(inputs);
  const additionalMarks = additionalDocsMarks61(inputs);
  const electoralMarks = electoralRegisterMarks61(inputs);
  const proximity = proximityMarks(
    inputs,
    PROXIMITY_PER_SCHOOL_61,
    PROXIMITY_MAX_61
  );
  const rows: ScoreRow[] = [
    {
      label: "Main residence document",
      marks: documentMarks,
      max: MAIN_DOCUMENT_MAX_61,
    },
    {
      label: "Additional documents",
      marks: additionalMarks,
      max: ADDITIONAL_DOC_MAX_61,
    },
    {
      label: "Electoral register",
      marks: electoralMarks,
      max: ELECTORAL_MAX_61,
    },
    { label: "Nearby schools", marks: proximity, max: PROXIMITY_MAX_61 },
  ];
  const total = cap(
    rows.reduce((sum, row) => sum + row.marks, 0),
    CATEGORY_MAX_MARKS
  );
  return { categoryType: "6.1", total, breakdown: rows };
};

// ─── 6.2 - Alumni ────────────────────────────────────────────────────────────

export const scoreCategory62 = (inputs: Inputs): CategoryScore => {
  const yearsMarks = cap(
    yearsBetween(str(inputs, "alumniStartDate"), str(inputs, "alumniEndDate")) *
      YEARS_EDUCATED_MARKS_PER_YEAR,
    YEARS_EDUCATED_MAX
  );
  const scholarshipMarks = bool(inputs, "grade5ScholarshipPassed")
    ? GRADE5_SCHOLARSHIP_MARKS
    : 0;
  const olMarks = examGradeMarks(
    inputs,
    "olSubjectCount",
    "ol",
    OL_CEILINGS,
    OL_MAX_MARKS
  );
  const alMarks = examGradeMarks(
    inputs,
    "alSubjectCount",
    "al",
    AL_CEILINGS,
    AL_MAX_MARKS
  );

  // Note: the source scheme has no separate "educational achievements" row —
  // the scholarship + O/L + A/L rows sum directly (3 + 10 + 12 = 25 = the
  // EDUCATIONAL_TOTAL_MAX ceiling), so the cap is inherently respected.
  const sportsEntries = listOf(inputs.sportsEntries);
  const sportsMarks = cap(
    sumTableMarks(sportsEntries, "levels", SPORTS_LEVEL_MARKS),
    SPORTS_MAX
  );

  const leadershipRoles = stringList(inputs.leadershipRoles);
  const leadershipMarks = cap(
    leadershipRoles.reduce(
      (sum: number, role) => sum + (LEADERSHIP_ROLE_MARKS[role] ?? 0),
      0
    ),
    LEADERSHIP_MAX
  );

  const societiesEntries = listOf(inputs.studentSocietiesEntries);
  const studentSocietiesMarks = cap(
    sumTableMarks(societiesEntries, "roles", STUDENT_SOCIETIES_ROLE_MARKS),
    STUDENT_SOCIETIES_MAX
  );

  const otherActivities = stringList(inputs.otherActivities);
  const otherActivityMarks = cap(
    otherActivities.reduce(
      (sum: number, activity) => sum + (OTHER_ACTIVITY_MARKS[activity] ?? 0),
      0
    ),
    OTHER_ACTIVITIES_MAX
  );

  let pastPupilsMarks = 0;
  if (bool(inputs, "pastPupilsLifeMember")) {
    const years = yearsFromDate(str(inputs, "pastPupilsLifeMemberStart"));
    pastPupilsMarks += cap(
      years * PAST_PUPILS_LIFE_MEMBER_MARKS_PER_YEAR,
      PAST_PUPILS_LIFE_MEMBER_MAX
    );
  } else if (
    str(inputs, "pastPupilsMembershipStart") &&
    str(inputs, "pastPupilsMembershipEnd")
  ) {
    const years = yearsBetween(
      str(inputs, "pastPupilsMembershipStart"),
      str(inputs, "pastPupilsMembershipEnd")
    );
    pastPupilsMarks += cap(
      years * PAST_PUPILS_YEARLY_MARKS,
      PAST_PUPILS_MEMBERSHIP_MAX
    );
  }
  const committeeExecutiveMarks =
    (num(inputs, "pastPupilsCommitteeYears") ?? 0) *
      PAST_PUPILS_COMMITTEE_MARKS_PER_YEAR +
    Math.min(
      num(inputs, "pastPupilsExecutiveCount") ?? 0,
      PAST_PUPILS_EXECUTIVE_COUNT
    ) *
      PAST_PUPILS_EXECUTIVE_MARKS;
  pastPupilsMarks += cap(
    committeeExecutiveMarks,
    PAST_PUPILS_COMMITTEE_EXECUTIVE_MAX
  );
  pastPupilsMarks = cap(pastPupilsMarks, PAST_PUPILS_TOTAL_MAX);

  const degreeMarks = cap(
    DEGREE_MARKS[str(inputs, "highestDegree") ?? ""] ?? 0,
    DEGREE_MAX
  );
  const diplomaMarks = bool(inputs, "hasDiploma") ? DIPLOMA_MARKS : 0;

  let contributionMarks = 0;
  contributionMarks +=
    (num(inputs, "carnivalContribution") ?? 0) * CARNIVAL_CONTRIBUTION;
  contributionMarks +=
    (num(inputs, "shramadanaContribution") ?? 0) * SHRAMADANA_CONTRIBUTION;
  const otherEntries = listOf(inputs.otherContributionEntries);
  const otherContributionCount = otherEntries.reduce(
    (sum: number, entry) =>
      sum + (typeof entry.count === "number" ? entry.count : 0),
    0
  );
  contributionMarks += otherContributionCount * CARNIVAL_CONTRIBUTION;
  contributionMarks = cap(contributionMarks, CONTRIBUTION_MAX);

  const projectMarks = bool(inputs, "schoolProjectsContribution")
    ? SCHOOL_PROJECTS_MARKS
    : 0;

  const rows: ScoreRow[] = [
    {
      label: "Years educated at school",
      marks: yearsMarks,
      max: YEARS_EDUCATED_MAX,
    },
    {
      label: "Grade 5 Scholarship",
      marks: scholarshipMarks,
      max: GRADE5_SCHOLARSHIP_MARKS,
    },
    { label: "G.C.E. (O/L)", marks: olMarks, max: OL_MAX_MARKS },
    { label: "G.C.E. (A/L)", marks: alMarks, max: AL_MAX_MARKS },
    { label: "Sports / co-curricular", marks: sportsMarks, max: SPORTS_MAX },
    { label: "Leadership role", marks: leadershipMarks, max: LEADERSHIP_MAX },
    {
      label: "Student societies",
      marks: studentSocietiesMarks,
      max: STUDENT_SOCIETIES_MAX,
    },
    {
      label: "Other activities",
      marks: otherActivityMarks,
      max: OTHER_ACTIVITIES_MAX,
    },
    {
      label: "Past Pupils' Association",
      marks: pastPupilsMarks,
      max: PAST_PUPILS_TOTAL_MAX,
    },
    { label: "University degrees", marks: degreeMarks, max: DEGREE_MAX },
    {
      label: "Diploma / Higher Diploma",
      marks: diplomaMarks,
      max: DIPLOMA_MARKS,
    },
    {
      label: "Contribution to school activities",
      marks: contributionMarks,
      max: CONTRIBUTION_MAX,
    },
    {
      label: "Contribution to school projects",
      marks: projectMarks,
      max: SCHOOL_PROJECTS_MARKS,
    },
  ];
  const total = cap(
    rows.reduce((sum, row) => sum + row.marks, 0),
    CATEGORY_MAX_MARKS
  );
  return { categoryType: "6.2", total, breakdown: rows };
};

// ─── 6.3 - Siblings ──────────────────────────────────────────────────────────

export const scoreCategory63 = (inputs: Inputs): CategoryScore => {
  const gradesCompletedMarks = cap(
    (num(inputs, "siblingGradesCompletedCount") ?? 0) * SIBLING_MARKS_PER_GRADE,
    SIBLING_GRADES_MAX
  );
  const studiedHereMarks = bool(inputs, "siblingStudiedAtAppliedSchool")
    ? SIBLING_STUDIED_HERE_MARKS
    : 0;
  const studyingOtherGradesMarks = bool(
    inputs,
    "twoOrMoreSiblingsStudyingOtherGrades"
  )
    ? SIBLING_MULTIPLE_STUDYING_MARKS
    : 0;

  const sportsEntries = listOf(inputs.siblingSportsEntries);
  const sportsMarks = cap(
    sumTableMarks(sportsEntries, "levels", SIBLING_SPORTS_LEVEL_MARKS),
    SIBLING_SPORTS_MAX
  );

  const examAchievements = stringList(inputs.siblingExamAchievements);
  const examMarks = cap(
    examAchievements.reduce(
      (sum: number, achievement) =>
        sum + (SIBLING_EXAM_MARKS[achievement] ?? 0),
      0
    ),
    SIBLING_EXAM_MAX
  );

  const leadershipMarks = bool(inputs, "siblingLeadershipAchievement")
    ? SIBLING_LEADERSHIP_MARKS
    : 0;
  const supportMarks = bool(inputs, "parentsSupportRendered")
    ? SIBLING_SUPPORT_MARKS
    : 0;
  const cocurricularTotal = cap(
    sportsMarks + examMarks + leadershipMarks + supportMarks,
    SIBLING_COCURRICULAR_TOTAL_MAX
  );

  const documentMarks = cap(
    MAIN_DOCUMENT_MARKS_63[str(inputs, "mainDocumentType") ?? ""] ?? 0,
    MAIN_DOCUMENT_MAX_63
  );
  const mother = electoralYearsRegistered(inputs.electoralMotherYears);
  const father = electoralYearsRegistered(inputs.electoralFatherYears);
  const electoralMarks = cap(
    (mother + father) * ELECTORAL_MARKS_PER_PERSON_YEAR_63,
    ELECTORAL_MAX_63
  );
  const proximity = proximityMarks(
    inputs,
    PROXIMITY_PER_SCHOOL_63,
    PROXIMITY_MAX_63
  );

  const rows: ScoreRow[] = [
    {
      label: "Grades completed by sibling",
      marks: gradesCompletedMarks,
      max: SIBLING_GRADES_MAX,
    },
    {
      label: "Sibling studied at applied school",
      marks: studiedHereMarks,
      max: SIBLING_STUDIED_HERE_MARKS,
    },
    {
      label: "Two or more siblings studying other grades",
      marks: studyingOtherGradesMarks,
      max: SIBLING_MULTIPLE_STUDYING_MARKS,
    },
    {
      label: "Sibling co-curricular & prefect",
      marks: cocurricularTotal,
      max: SIBLING_COCURRICULAR_TOTAL_MAX,
    },
    {
      label: "Residence document",
      marks: documentMarks,
      max: MAIN_DOCUMENT_MAX_63,
    },
    {
      label: "Electoral register",
      marks: electoralMarks,
      max: ELECTORAL_MAX_63,
    },
    { label: "Nearby schools", marks: proximity, max: PROXIMITY_MAX_63 },
  ];
  const total = cap(
    rows.reduce((sum, row) => sum + row.marks, 0),
    CATEGORY_MAX_MARKS
  );
  return { categoryType: "6.3", total, breakdown: rows };
};

// ─── 6.4 - Education Sector / Teaching Staff ─────────────────────────────────

/** 7.5.3.1/7.5.3.2 shared shape: rate × full years (capped) + one-off
 * half-rate bonus once a completed year carries a 6-month-or-more remainder. */
const rateTimesYearsWithBonus = (
  years: number,
  remainderMonths: number,
  rate: number,
  branchMax: number
): number => {
  let marks = Math.min(years, DIFFICULT_SERVICE_YEARS_CAP) * rate;
  if (years >= 1 && remainderMonths >= DIFFICULT_SERVICE_BONUS_MIN_MONTHS) {
    marks += rate / 2;
  }
  return cap(marks, branchMax);
};

export const difficultServiceCurrentMarks = (
  startDate: string | undefined
): number => {
  const { years, remainderMonths } = yearsAndMonthsBetween(startDate);
  return rateTimesYearsWithBonus(
    years,
    remainderMonths,
    DIFFICULT_SERVICE_CURRENT_RATE,
    DIFFICULT_SERVICE_MAX
  );
};

export const difficultServicePreviousMarks = (
  startDate: string | undefined,
  endDate: string | undefined
): number => {
  const { years, remainderMonths } = yearsAndMonthsBetween(startDate, endDate);
  return rateTimesYearsWithBonus(
    years,
    remainderMonths,
    DIFFICULT_SERVICE_PREVIOUS_RATE,
    15
  );
};

export const difficultServiceDistanceMarks = (
  startDate: string | undefined,
  endDate: string | undefined,
  km: number | undefined
): number => {
  if (km === undefined) {
    return 0;
  }
  const tier = DIFFICULT_DISTANCE_RATE_TIERS.find(([minKm]) => km >= minKm);
  if (!tier) {
    return 0;
  }
  const [, ratePerYear, tierCap] = tier;
  const { years, remainderMonths } = yearsAndMonthsBetween(startDate, endDate);
  return rateTimesYearsWithBonus(years, remainderMonths, ratePerYear, tierCap);
};

/** 7.5.1 Path I whole-years-plus-bonus split for a single period. */
const contributionPeriodYearsEquivalent = (
  years: number,
  remainderMonths: number
): { wholeYears: number; bonusYears: number } => {
  if (years === 0) {
    return { wholeYears: 0, bonusYears: remainderMonths === 0 ? 0 : 0.5 };
  }
  return { wholeYears: years, bonusYears: remainderMonths >= 6 ? 0.5 : 0 };
};

/** 7.5.1 — eligibility gate for the rest of category 6.4. */
export const contributionMarks64 = (inputs: Inputs): number => {
  const path = str(inputs, "contributionPath") ?? "institution";
  if (path === "institution") {
    const rate =
      bool(inputs, "contributionSameSchool") === true
        ? CONTRIBUTION_PATH1_SAME_SCHOOL_RATE
        : CONTRIBUTION_PATH1_ELSEWHERE_RATE;
    const { years, remainderMonths } = yearsAndMonthsBetween(
      str(inputs, "contributionServiceStartDate")
    );
    const { wholeYears, bonusYears } = contributionPeriodYearsEquivalent(
      years,
      remainderMonths
    );
    const creditedYears = Math.min(
      wholeYears + bonusYears,
      CONTRIBUTION_PATH1_YEARS_CAP
    );
    return cap(creditedYears * rate, SCHOOL_EDUCATION_CONTRIBUTION_MAX);
  }
  if (path === "university") {
    const examMarks = cap(
      (num(inputs, "contributionExamYears") ?? 0) *
        CONTRIBUTION_PATH2_RATE_PER_ITEM,
      CONTRIBUTION_PATH2_ITEM_MAX
    );
    const curriculumMarks = cap(
      (num(inputs, "contributionCurriculumYears") ?? 0) *
        CONTRIBUTION_PATH2_RATE_PER_ITEM,
      CONTRIBUTION_PATH2_ITEM_MAX
    );
    const trainingMarks = cap(
      (num(inputs, "contributionTrainingYears") ?? 0) *
        CONTRIBUTION_PATH2_RATE_PER_ITEM,
      CONTRIBUTION_PATH2_ITEM_MAX
    );
    return cap(
      examMarks + curriculumMarks + trainingMarks,
      SCHOOL_EDUCATION_CONTRIBUTION_MAX
    );
  }
  return 0;
};

export const tieredDistanceMarks = (
  km: number | undefined,
  tiers: [number, number][],
  fallback: number
): number => {
  if (km === undefined) {
    return 0;
  }
  for (const [limit, marks] of tiers) {
    if (km <= limit) {
      return marks;
    }
  }
  return fallback;
};

export const workplaceDistanceMarks = (km: number | undefined): number => {
  if (km === undefined) {
    return 0;
  }
  for (const [minKm, marks] of WORKPLACE_DISTANCE_TIERS) {
    if (km >= minKm) {
      return marks;
    }
  }
  return WORKPLACE_DISTANCE_FALLBACK;
};

export const scoreCategory64 = (inputs: Inputs): CategoryScore => {
  // 7.5.1 is an eligibility gate, not just another line item: scoring zero
  // on contribution zeroes the rest of the category.
  const contributionMarks = contributionMarks64(inputs);
  const gateOpen = contributionMarks > 0;

  const serviceMarks = gateOpen
    ? cap(
        wholeYearsFromDate(str(inputs, "serviceStartDate")),
        SERVICE_PERIOD_MAX
      )
    : 0;

  let difficultMarks = 0;
  if (gateOpen && str(inputs, "difficultServiceType") === "current") {
    difficultMarks = difficultServiceCurrentMarks(
      str(inputs, "difficultServiceStartDate")
    );
  } else if (gateOpen && str(inputs, "difficultServiceType") === "previous") {
    const previousBranch = difficultServicePreviousMarks(
      str(inputs, "difficultServicePreviousStartDate"),
      str(inputs, "difficultServicePreviousEndDate")
    );
    const distanceBranch = difficultServiceDistanceMarks(
      str(inputs, "difficultServiceDistanceStartDate"),
      str(inputs, "difficultServiceDistanceEndDate"),
      num(inputs, "difficultServiceDistanceKm")
    );
    difficultMarks = Math.max(previousBranch, distanceBranch);
  }
  difficultMarks = cap(difficultMarks, DIFFICULT_SERVICE_MAX);

  // 7.5.4 restricts unutilized-leave marks to Path I (institution) officers.
  const leaveMarks =
    gateOpen && str(inputs, "contributionPath") !== "university"
      ? cap(
          (num(inputs, "unutilizedLeaveYears") ?? 0) *
            UNUTILIZED_LEAVE_MARKS_PER_YEAR,
          UNUTILIZED_LEAVE_MAX
        )
      : 0;
  const residenceDistance = gateOpen
    ? tieredDistanceMarks(
        num(inputs, "residenceToSchoolKm"),
        RESIDENCE_DISTANCE_TIERS_64,
        RESIDENCE_DISTANCE_FALLBACK_64
      )
    : 0;
  const workplaceDistance = gateOpen
    ? workplaceDistanceMarks(num(inputs, "workplaceToSchoolKm"))
    : 0;

  const rows: ScoreRow[] = [
    {
      label: "Contribution to school education",
      marks: contributionMarks,
      max: SCHOOL_EDUCATION_CONTRIBUTION_MAX,
    },
    {
      label: "Period of service",
      marks: serviceMarks,
      max: SERVICE_PERIOD_MAX,
    },
    {
      label: "Difficult service",
      marks: difficultMarks,
      max: DIFFICULT_SERVICE_MAX,
    },
    { label: "Unutilized leave", marks: leaveMarks, max: UNUTILIZED_LEAVE_MAX },
    {
      label: "Residence to school",
      marks: residenceDistance,
      max: RESIDENCE_DISTANCE_MAX_64,
    },
    {
      label: "Workplace to school",
      marks: workplaceDistance,
      max: WORKPLACE_DISTANCE_MAX,
    },
  ];
  const total = cap(
    rows.reduce((sum, row) => sum + row.marks, 0),
    CATEGORY_MAX_MARKS
  );
  return { categoryType: "6.4", total, breakdown: rows };
};

// ─── 6.5 - Transfer Applications ─────────────────────────────────────────────

export const transferDistanceMarks = (km: number | undefined): number => {
  if (km === undefined) {
    return 0;
  }
  for (const [minKm, marks] of TRANSFER_DISTANCE_TIERS) {
    if (km >= minKm) {
      return marks;
    }
  }
  return 0;
};

export const previousPeriodMarks = (years: number): number => {
  for (const [minYears, marks] of TRANSFER_PREVIOUS_PERIOD_TIERS) {
    if (years >= minYears) {
      return marks;
    }
  }
  return 0;
};

export const transferElapsedMarks = (elapsed: number): number => {
  for (const [maxYears, marks] of TRANSFER_ELAPSED_TIERS) {
    if (elapsed <= maxYears) {
      return marks;
    }
  }
  return 0;
};

export const scoreCategory65 = (inputs: Inputs): CategoryScore => {
  const distanceMarks = transferDistanceMarks(
    num(inputs, "previousWorkplaceDistanceKm")
  );
  const proximity = proximityMarks(
    inputs,
    PROXIMITY_PER_SCHOOL_65,
    PROXIMITY_MAX_65
  );
  const periodMarks = cap(
    wholeYearsFromDate(str(inputs, "serviceStartDate")),
    TRANSFER_SERVICE_PERIOD_MAX
  );
  const prevYears = yearsFromDate(str(inputs, "previousWorkplaceStartDate"));
  const prevPeriodMarks = previousPeriodMarks(prevYears);
  let elapsedMarks = 0;
  if (str(inputs, "transferDate")) {
    elapsedMarks = transferElapsedMarks(
      yearsFromDate(str(inputs, "transferDate"))
    );
  }
  const leaveMarks = cap(
    (num(inputs, "unutilizedLeaveYears") ?? 0) *
      UNUTILIZED_LEAVE_MARKS_PER_YEAR,
    UNUTILIZED_LEAVE_MAX
  );

  const rows: ScoreRow[] = [
    {
      label: "Previous-to-new workplace distance",
      marks: distanceMarks,
      max: TRANSFER_DISTANCE_MAX,
    },
    { label: "Nearby schools", marks: proximity, max: PROXIMITY_MAX_65 },
    {
      label: "Period of service",
      marks: periodMarks,
      max: TRANSFER_SERVICE_PERIOD_MAX,
    },
    {
      label: "Period at previous workplace",
      marks: prevPeriodMarks,
      max: TRANSFER_PREVIOUS_PERIOD_MAX,
    },
    {
      label: "Time since transfer",
      marks: elapsedMarks,
      max: TRANSFER_ELAPSED_MAX,
    },
    { label: "Unutilized leave", marks: leaveMarks, max: UNUTILIZED_LEAVE_MAX },
  ];
  const total = cap(
    rows.reduce((sum, row) => sum + row.marks, 0),
    CATEGORY_MAX_MARKS
  );
  return { categoryType: "6.5", total, breakdown: rows };
};

// ─── 6.6 - Foreign Employment ────────────────────────────────────────────────

export const abroadPeriodMarks = (years: number): number => {
  for (const [minYears, marks] of ABROAD_PERIOD_TIERS) {
    if (years >= minYears) {
      return marks;
    }
  }
  return 0;
};

export const scoreCategory66 = (inputs: Inputs): CategoryScore => {
  const abroad = yearsBetween(
    str(inputs, "abroadStartDate"),
    str(inputs, "abroadEndDate")
  );
  const abroadMarks = abroadPeriodMarks(abroad);
  const purposeMarks = cap(
    EMPLOYMENT_PURPOSE_MARKS[str(inputs, "employmentPurpose") ?? ""] ?? 0,
    EMPLOYMENT_PURPOSE_MAX
  );
  const proximity = proximityMarks(
    inputs,
    PROXIMITY_PER_SCHOOL_66,
    PROXIMITY_MAX_66
  );

  const rows: ScoreRow[] = [
    {
      label: "Continuous period abroad with child",
      marks: abroadMarks,
      max: ABROAD_PERIOD_MAX,
    },
    {
      label: "Employment purpose",
      marks: purposeMarks,
      max: EMPLOYMENT_PURPOSE_MAX,
    },
    { label: "Nearby schools", marks: proximity, max: PROXIMITY_MAX_66 },
  ];
  const total = cap(
    rows.reduce((sum, row) => sum + row.marks, 0),
    CATEGORY_MAX_MARKS
  );
  return { categoryType: "6.6", total, breakdown: rows };
};

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export const scoreCategory = (entry: MarkingCategoryEntry): CategoryScore => {
  switch (entry.type as MarkingCategoryType) {
    case "6.1": {
      return scoreCategory61(entry.inputs);
    }
    case "6.2": {
      return scoreCategory62(entry.inputs);
    }
    case "6.3": {
      return scoreCategory63(entry.inputs);
    }
    case "6.4": {
      return scoreCategory64(entry.inputs);
    }
    case "6.5": {
      return scoreCategory65(entry.inputs);
    }
    case "6.6": {
      return scoreCategory66(entry.inputs);
    }
    default: {
      return { categoryType: entry.type, total: 0, breakdown: [] };
    }
  }
};

/** Scores every entry of an application's `categories` array. */
export const scoreApplication = (
  entries: MarkingCategoryEntry[]
): { total: number; perEntry: CategoryScore[] } => {
  const perEntry = entries.map((entry) => scoreCategory(entry));
  const total = cap(
    perEntry.reduce((sum, score) => sum + score.total, 0),
    perEntry.length * CATEGORY_MAX_MARKS
  );
  return { total, perEntry };
};
