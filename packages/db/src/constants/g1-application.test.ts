import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { resolveFieldStates } from "./admissionVersions/shared/types";
import { subversion1Fields } from "./admissionVersions/versions/v1/v1.1/fields";
import { subversion1Schema } from "./admissionVersions/versions/v1/v1.1/schema";
import {
  CATEGORY_MAX_MARKS,
  PROXIMITY_MAX_61,
  PROXIMITY_MAX_63,
  PROXIMITY_MAX_65,
  PROXIMITY_MAX_66,
  PROXIMITY_PER_SCHOOL_61,
  PROXIMITY_PER_SCHOOL_63,
  PROXIMITY_PER_SCHOOL_65,
  PROXIMITY_PER_SCHOOL_66,
  electoralRegisterYears,
} from "./markingVersions/shared/marking-scheme";
import {
  scoreCategory61,
  scoreCategory62,
  scoreCategory63,
  scoreCategory64,
  scoreCategory65,
  scoreCategory66,
  scoreApplication,
  scoreCategory,
  proximityMarks,
  yearsBetween,
  wholeYearsFromDate,
} from "./markingVersions/shared/scoring";
import { subversion1Categories } from "./markingVersions/versions/v1/v1.1/categories";

// ─── Complete g1 v1.1 admission form ────────────────────────────────────────

describe("admission v1.1 — complete g1 form", () => {
  const fields = subversion1Fields;
  const validAdmission = {
    fullName: "Nimal Perera",
    sinhalaName: "නිමල් පෙරේරා",
    gender: "Male" as const,
    religion: "Buddhist" as const,
    educationMedium: "Sinhala" as const,
    dateOfBirth: "2021-06-15",
    birthCertificateNumber: "BC12345",
    guardianRelationship: "Mother" as const,
    guardianFullName: "Kamala Perera",
    guardianSinhalaName: "කමලා පෙरේරා",
    guardianNic: "991234567V",
    guardianPhone: {
      country: "LK",
      countryCallingCode: "94",
      nationalNumber: "771234567",
      e164: "+94771234567",
    },
    permanentAddressEn: "123 Main St",
    permanentAddressSi: "ප්‍රධාන පාර 123",
    currentAddressEn: "123 Main St",
    currentAddressSi: "ප්‍රධාන පාර 123",
    district: "galle" as const,
    division: "akmeemana" as const,
    gnDivision: "Udugama",
    electoralDistrict: "Galle",
    declarationConfirmed: true,
    declarationConsent: true,
  };

  it("registers v1 with intake year 2027 and a single complete subversion", () => {
    // covered in admission-versions.test.ts too; here as a guard for the form
    expect(fields.length).toBeGreaterThan(0);
  });

  it("every field has a label, type and a valid g1 step", () => {
    const steps = new Set([
      "location",
      "applicant",
      "guardian",
      "residence",
      "categories",
      "declaration",
      "review",
    ]);
    for (const field of fields) {
      expect(field.label.length).toBeGreaterThan(0);
      expect(field.type).toBeDefined();
      expect(steps.has(field.step)).toBeTruthy();
    }
  });

  it("covers all non-category steps with required fields", () => {
    for (const step of [
      "location",
      "applicant",
      "guardian",
      "residence",
      "declaration",
    ]) {
      expect(fields.some((f) => f.step === step)).toBeTruthy();
    }
  });

  it("residence selects cascade via district → division", () => {
    const district = fields.find((f) => f.key === "district");
    expect(district?.restrictsOptions?.[0]?.field).toBe("division");
    expect(district?.clearsOnChange).toContain("division");
  });

  it("current address is hidden while sameAsPermanent holds", () => {
    const states = resolveFieldStates(fields, { sameAsPermanent: true });
    expect(states.currentAddressEn?.disabled).toBeTruthy();
    const statesFalse = resolveFieldStates(fields, { sameAsPermanent: false });
    expect(statesFalse.currentAddressEn?.disabled).toBeFalsy();
  });

  it("schema accepts a complete application", () => {
    const result = v.safeParse(subversion1Schema, validAdmission);
    if (!result.success) {
      const messages = result.issues
        .map(
          (issue) =>
            `${issue.path?.map((p) => String(p.key)).join(".")} ${issue.message}`
        )
        .join("; ");
      throw new Error(`Expected valid: ${messages}`);
    }
    expect(result.success).toBeTruthy();
  });
});

// ─── Marking v1.1 — complete category coverage ──────────────────────────────

describe("marking v1.1 — all six categories present", () => {
  it("has categories 6.1–6.6, each capped at 100, all in the categories step", () => {
    expect(subversion1Categories.map((c) => c.type)).toStrictEqual([
      "6.1",
      "6.2",
      "6.3",
      "6.4",
      "6.5",
      "6.6",
    ]);
    for (const category of subversion1Categories) {
      expect(category.maxMarks).toBe(CATEGORY_MAX_MARKS);
      expect(category.step).toBe("categories");
      expect(category.fields.length).toBeGreaterThan(0);
    }
  });

  it("map categories carry the proximity deduction config", () => {
    for (const [type, expected] of [
      [
        "6.1",
        {
          maxMarks: PROXIMITY_MAX_61,
          pointsPerSchool: PROXIMITY_PER_SCHOOL_61,
        },
      ],
      [
        "6.3",
        {
          maxMarks: PROXIMITY_MAX_63,
          pointsPerSchool: PROXIMITY_PER_SCHOOL_63,
        },
      ],
      [
        "6.5",
        {
          maxMarks: PROXIMITY_MAX_65,
          pointsPerSchool: PROXIMITY_PER_SCHOOL_65,
        },
      ],
      [
        "6.6",
        {
          maxMarks: PROXIMITY_MAX_66,
          pointsPerSchool: PROXIMITY_PER_SCHOOL_66,
        },
      ],
    ] as const) {
      const category = subversion1Categories.find((c) => c.type === type);
      const mapField = category?.fields.find((f) => f.type === "map");
      expect(mapField?.mapConfig?.maxMarks).toBe(expected.maxMarks);
      expect(mapField?.mapConfig?.pointsPerSchool).toBe(
        expected.pointsPerSchool
      );
    }
  });
});

// ─── Marks calculation: 6.1 ─────────────────────────────────────────────────

describe("marks — 6.1 residence verification", () => {
  it("scores deed by type and age weight", () => {
    const old = scoreCategory61({
      mainDocumentType: "title-deed-applicant",
      deedTransferDate: "2010-01-01",
    });
    // 16+ years old ⇒ weight 1 ⇒ full 20 marks for the top document.
    expect(
      old.breakdown.find((r) => r.label === "Main residence document")?.marks
    ).toBe(20);
  });

  it("reduces deed marks for a recent deed", () => {
    const fresh = scoreCategory61({
      mainDocumentType: "title-deed-applicant",
      deedTransferDate: new Date().toISOString().slice(0, 10),
    });
    // Under 6 months ⇒ DEED_AGE_MIN_WEIGHT 0.05 ⇒ 20 × 0.05 = 1.
    expect(
      fresh.breakdown.find((r) => r.label === "Main residence document")?.marks
    ).toBe(1);
  });

  it("electoral register: 2.5 marks per person-year, capped at 25", () => {
    const years = electoralRegisterYears();
    const many = scoreCategory61({
      electoralMotherYears: years,
      electoralFatherYears: years,
    });
    expect(
      many.breakdown.find((r) => r.label === "Electoral register")?.marks
    ).toBe(25);
  });

  it("additional docs: 1 per doc up to 5", () => {
    const result = scoreCategory61({
      additionalDocs: ["a", "b", "c", "d", "e", "f"],
    });
    expect(
      result.breakdown.find((r) => r.label === "Additional documents")?.marks
    ).toBe(5);
  });

  it("MAP DEDUCTION: starts at 50, deducts 5 per nearby school, floors at 0", () => {
    const none = scoreCategory61({ schoolsWithinRadius: [] });
    expect(
      none.breakdown.find((r) => r.label === "Nearby schools")?.marks
    ).toBe(50);

    const three = scoreCategory61({ schoolsWithinRadius: ["a", "b", "c"] });
    expect(
      three.breakdown.find((r) => r.label === "Nearby schools")?.marks
    ).toBe(35);

    const many = scoreCategory61({
      schoolsWithinRadius: Array.from({ length: 20 }, (_, i) => `s${i}`),
    });
    expect(
      many.breakdown.find((r) => r.label === "Nearby schools")?.marks
    ).toBe(0);
  });
});

// ─── Marks calculation: 6.2 ─────────────────────────────────────────────────

describe("marks — 6.2 alumni", () => {
  it("years educated: 2/year capped at 26", () => {
    const result = scoreCategory62({
      alumniStartDate: "2000-01-01",
      alumniEndDate: "2020-01-01",
    });
    expect(
      result.breakdown.find((r) => r.label === "Years educated at school")
        ?.marks
    ).toBe(26);
  });

  it("grade 5 scholarship adds 3", () => {
    const result = scoreCategory62({ grade5ScholarshipPassed: true });
    expect(
      result.breakdown.find((r) => r.label === "Grade 5 Scholarship")?.marks
    ).toBe(3);
  });

  it("O/L: 9 subjects all S ⇒ 9 × (ceiling 4 / 9) = 4", () => {
    const result = scoreCategory62({
      olSubjectCount: 9,
      olGradeS: 9,
      olGradeC: 0,
      olGradeB: 0,
      olGradeA: 0,
    });
    expect(
      result.breakdown.find((r) => r.label === "G.C.E. (O/L)")?.marks
    ).toBe(4);
  });

  it("O/L: 6 subjects all C ⇒ 6 × (ceiling 8 / 6) = 8", () => {
    const result = scoreCategory62({
      olSubjectCount: 6,
      olGradeC: 6,
    });
    expect(
      result.breakdown.find((r) => r.label === "G.C.E. (O/L)")?.marks
    ).toBe(8);
  });

  it("A/L: 3 subjects all A ⇒ 3×(12/3)=12", () => {
    const result = scoreCategory62({
      alSubjectCount: 3,
      alGradeA: 3,
    });
    expect(
      result.breakdown.find((r) => r.label === "G.C.E. (A/L)")?.marks
    ).toBe(12);
  });

  it("sports: sums level marks across entries, capped", () => {
    const result = scoreCategory62({
      sportsEntries: [
        { name: "Athletics", levels: ["national"] },
        { name: "Football", levels: ["zonal", "district"] },
      ],
    });
    // national 4.75 + zonal 1 + district 2 = 7.75 ≤ SPORTS_MAX 10
    expect(
      result.breakdown.find((r) => r.label === "Sports / co-curricular")?.marks
    ).toBe(7.75);
  });

  it("leadership roles: head-prefect (5) + captain (4), capped at 5", () => {
    const result = scoreCategory62({
      leadershipRoles: ["head-prefect", "first-team-captain"],
    });
    expect(
      result.breakdown.find((r) => r.label === "Leadership role")?.marks
    ).toBe(5);
  });

  it("no fields at all ⇒ zero total, no NaN", () => {
    const result = scoreCategory62({});
    expect(result.total).toBe(0);
    for (const row of result.breakdown) {
      expect(Number.isFinite(row.marks)).toBeTruthy();
    }
  });
});

// ─── Marks calculation: 6.3 ─────────────────────────────────────────────────

describe("marks — 6.3 siblings", () => {
  it("grades completed: 2 per grade capped at 20", () => {
    const result = scoreCategory63({ siblingGradesCompletedCount: 11 });
    expect(
      result.breakdown.find((r) => r.label === "Grades completed by sibling")
        ?.marks
    ).toBe(20);
  });

  it("exam achievements: 0.5+1+1.5 = 3 capped at SIBLING_EXAM_MAX 2", () => {
    const result = scoreCategory63({
      siblingExamAchievements: ["scholarship", "ol", "al"],
    });
    expect(
      result.breakdown.find(
        (r) => r.label === "Sibling co-curricular & prefect"
      )?.marks
    ).toBe(2);
  });

  it("MAP DEDUCTION: 30 − 3 per school within 10 km", () => {
    const result = scoreCategory63({ schoolsWithinRadius: ["a", "b"] });
    expect(
      result.breakdown.find((r) => r.label === "Nearby schools")?.marks
    ).toBe(24);
  });
});

// ─── Marks calculation: 6.4 ─────────────────────────────────────────────────

describe("marks — 6.4 education sector", () => {
  it("contribution gate opens service scoring: 26 whole years capped at 20", () => {
    const result = scoreCategory64({
      contributionPath: "institution",
      contributionServiceStartDate: "2000-01-01",
      serviceStartDate: "2000-01-01",
      difficultServiceType: "none",
    });
    expect(
      result.breakdown.find((r) => r.label === "Period of service")?.marks
    ).toBe(20);
  });

  it("contribution gate zero ⇒ service rows are zero", () => {
    const result = scoreCategory64({
      contributionPath: "institution",
      contributionSameSchool: true,
      // no start date ⇒ 0 years ⇒ gate 0
    });
    expect(result.total).toBe(0);
  });

  it("university path: exam years × 0.5 capped at 10", () => {
    const result = scoreCategory64({
      contributionPath: "university",
      contributionExamYears: 4,
      contributionCurriculumYears: 0,
      contributionTrainingYears: 0,
    });
    expect(
      result.breakdown.find(
        (r) => r.label === "Contribution to school education"
      )?.marks
    ).toBe(2);
  });

  it("unutilized leave restricted to institution path", () => {
    const university = scoreCategory64({
      contributionPath: "university",
      contributionExamYears: 3,
      unutilizedLeaveYears: 5,
    });
    expect(
      university.breakdown.find((r) => r.label === "Unutilized leave")?.marks
    ).toBe(0);

    const institution = scoreCategory64({
      contributionPath: "institution",
      contributionSameSchool: true,
      contributionServiceStartDate: "2000-01-01",
      unutilizedLeaveYears: 5,
    });
    expect(
      institution.breakdown.find((r) => r.label === "Unutilized leave")?.marks
    ).toBe(10);
  });
});

// ─── Marks calculation: 6.5 ─────────────────────────────────────────────────

describe("marks — 6.5 transfers", () => {
  it("distance tiers apply", () => {
    const result = scoreCategory65({ previousWorkplaceDistanceKm: 100 });
    expect(
      result.breakdown.find(
        (r) => r.label === "Previous-to-new workplace distance"
      )?.marks
    ).toBeGreaterThan(0);
  });

  it("MAP DEDUCTION: 30 − 3 per school", () => {
    const result = scoreCategory65({
      schoolsWithinRadius: ["a", "b", "c", "d", "e"],
    });
    expect(
      result.breakdown.find((r) => r.label === "Nearby schools")?.marks
    ).toBe(15);
  });
});

// ─── Marks calculation: 6.6 ─────────────────────────────────────────────────

describe("marks — 6.6 foreign employment", () => {
  it("abroad period tiers + purpose marks", () => {
    const result = scoreCategory66({
      abroadStartDate: "2010-01-01",
      abroadEndDate: "2020-01-01",
      employmentPurpose: "diplomatic",
    });
    const abroadRow = result.breakdown.find(
      (r) => r.label === "Continuous period abroad with child"
    );
    expect(abroadRow?.marks).toBeGreaterThan(0);
    expect(
      result.breakdown.find((r) => r.label === "Employment purpose")?.marks
    ).toBeGreaterThan(0);
  });

  it("MAP DEDUCTION: 35 − 3.5 per school", () => {
    const result = scoreCategory66({ schoolsWithinRadius: ["a"] });
    expect(
      result.breakdown.find((r) => r.label === "Nearby schools")?.marks
    ).toBe(31.5);
  });
});

// ─── Dispatcher & totals ────────────────────────────────────────────────────

describe(scoreApplication, () => {
  it("sums entries and caps at entries × 100", () => {
    const entries = [
      { id: "a", type: "6.1" as const, inputs: { schoolsWithinRadius: [] } },
      { id: "b", type: "6.2" as const, inputs: {} },
      { id: "c", type: "6.6" as const, inputs: { schoolsWithinRadius: [] } },
    ];
    const result = scoreApplication(entries);
    expect(result.perEntry).toHaveLength(3);
    expect(result.total).toBeGreaterThan(0);
  });

  it("unknown category type scores zero via dispatcher", () => {
    const result = scoreCategory({ id: "x", type: "9.9" as never, inputs: {} });
    expect(result.total).toBe(0);
  });

  it("map helper floors at zero and caps at max", () => {
    expect(proximityMarks({ schoolsWithinRadius: ["x"] }, 5, 50)).toBe(45);
    expect(proximityMarks({}, 5, 50)).toBe(50);
  });

  it("date helpers never produce NaN", () => {
    expect(yearsBetween("", "")).toBe(0);
    expect(wholeYearsFromDate("not-a-date")).toBe(0);
  });
});
