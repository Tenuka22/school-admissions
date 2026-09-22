import { describe, expect, it } from "vitest";

import { resolveFieldStates } from "../admissionVersions/shared/types";
import {
  MARKING_STEPS,
  MARKING_VERSIONS,
  buildEntrySchema,
  calculateMarkingMigrationRequirements,
  electoralRegisterYears,
  getCategoriesForSubversion,
  getLatestMarkingSubversionNumber,
  getMarkingSubversionModule,
  scoreApplication,
  scoreCategory,
  validateCategoryEntries,
} from "./index";

const { v1 } = MARKING_VERSIONS;
if (!v1) {
  throw new Error("v1 must be registered");
}

const makeEntry = (
  type: string,
  id = "e1",
  inputs: Record<string, unknown> = {}
) =>
  ({ id, type, inputs }) as Parameters<
    typeof validateCategoryEntries
  >[1][number];

// ─── MARKING_VERSIONS registry ──────────────────────────────────────────────

describe("MARKING_VERSIONS registry", () => {
  it("contains v1", () => {
    expect(v1).toBeDefined();
  });

  it("v1 has correct metadata", () => {
    expect(v1.key).toBe("v1");
    expect(v1.intakeYear).toBe(2027);
  });

  it("v1 has a single complete subversion (1)", () => {
    expect(Object.keys(v1.subversions)).toStrictEqual(["1"]);
  });
});

// ─── getLatestMarkingSubversionNumber ───────────────────────────────────────

describe(getLatestMarkingSubversionNumber, () => {
  it("returns 1 for v1", () => {
    expect(getLatestMarkingSubversionNumber("v1")).toBe(1);
  });

  it("returns 0 for unknown version", () => {
    expect(getLatestMarkingSubversionNumber("v99")).toBe(0);
  });
});

// ─── getMarkingSubversionModule ─────────────────────────────────────────────

describe(getMarkingSubversionModule, () => {
  it("returns subversion 1", () => {
    const mod = getMarkingSubversionModule("v1", 1);
    expect(mod?.subversion).toBe(1);
    expect(mod?.description).toContain("6.1");
  });

  it("returns latest subversion when omitted", () => {
    const mod = getMarkingSubversionModule("v1");
    expect(mod?.subversion).toBe(1);
  });

  it("returns undefined for unknown version", () => {
    expect(getMarkingSubversionModule("v99", 1)).toBeUndefined();
  });
});

// ─── getCategoriesForSubversion ─────────────────────────────────────────────

describe(getCategoriesForSubversion, () => {
  it("returns all 6 circular categories for v1.1", () => {
    const categories = getCategoriesForSubversion("v1", 1);
    expect(categories?.map((c) => c.type)).toStrictEqual([
      "6.1",
      "6.2",
      "6.3",
      "6.4",
      "6.5",
      "6.6",
    ]);
  });

  it("caps every category at 100 marks", () => {
    const categories = getCategoriesForSubversion("v1", 1) ?? [];
    for (const category of categories) {
      expect(category.maxMarks).toBe(100);
    }
  });

  it("every category has fields and a valid step", () => {
    const categories = getCategoriesForSubversion("v1", 1) ?? [];
    for (const category of categories) {
      expect(category.fields.length).toBeGreaterThan(0);
      expect(MARKING_STEPS).toContain(category.step);
    }
  });

  it("returns undefined for unknown version", () => {
    expect(getCategoriesForSubversion("v99", 1)).toBeUndefined();
  });
});

// ─── calculateMarkingMigrationRequirements ──────────────────────────────────

describe(calculateMarkingMigrationRequirements, () => {
  it("returns empty migrations within a single subversion", () => {
    const result = calculateMarkingMigrationRequirements("v1", 1, 1);
    expect(result.newCategories).toHaveLength(0);
    expect(result.removedCategoryTypes).toHaveLength(0);
    expect(result.patchedCategories).toHaveLength(0);
  });

  it("throws for unknown version", () => {
    expect(() => calculateMarkingMigrationRequirements("v99", 1, 2)).toThrow(
      "Marking version 'v99' not found"
    );
  });
});

// ─── validateCategoryEntries ────────────────────────────────────────────────

describe("category entry validation", () => {
  const categories = getCategoriesForSubversion("v1", 1) ?? [];

  it("accepts entries for defined categories", () => {
    const result = validateCategoryEntries(categories, [
      makeEntry("6.1"),
      makeEntry("6.2", "e2"),
    ]);
    expect(result.valid).toBeTruthy();
  });

  it("rejects unknown category types", () => {
    const result = validateCategoryEntries(categories, [makeEntry("6.9")]);
    expect(result.valid).toBeFalsy();
    expect(result.errors[0]).toContain("Unknown category type");
  });

  it("allows multiple entries of the same type (unique ids only, like g1)", () => {
    const siblingsOk = validateCategoryEntries(categories, [
      makeEntry("6.3", "s1"),
      makeEntry("6.3", "s2"),
    ]);
    expect(siblingsOk.valid).toBeTruthy();
  });
});

// ─── Map proximity deduction ────────────────────────────────────────────────

describe("map proximity deduction (schoolsWithinRadius)", () => {
  it("6.1 starts at 50 and deducts 5 per nearby school", () => {
    const score = scoreCategory(
      makeEntry("6.1", "m1", { schoolsWithinRadius: [] })
    );
    const row = score.breakdown.find((r) => r.label === "Nearby schools");
    expect(row?.max).toBe(50);
    expect(row?.marks).toBe(50);

    const with3 = scoreCategory(
      makeEntry("6.1", "m2", { schoolsWithinRadius: ["a", "b", "c"] })
    );
    expect(
      with3.breakdown.find((r) => r.label === "Nearby schools")?.marks
    ).toBe(35);

    const with12 = scoreCategory(
      makeEntry("6.1", "m3", {
        schoolsWithinRadius: Array.from({ length: 12 }, (_, i) => `s${i}`),
      })
    );
    expect(
      with12.breakdown.find((r) => r.label === "Nearby schools")?.marks
    ).toBe(0);
  });

  it("6.3 uses 30 max / 3 per school", () => {
    const score = scoreCategory(
      makeEntry("6.3", "m1", { schoolsWithinRadius: ["a", "b"] })
    );
    expect(
      score.breakdown.find((r) => r.label === "Nearby schools")?.marks
    ).toBe(24);
  });

  it("6.5 uses 30 max / 3 per school", () => {
    const score = scoreCategory(
      makeEntry("6.5", "m1", { schoolsWithinRadius: ["a"] })
    );
    expect(
      score.breakdown.find((r) => r.label === "Nearby schools")?.marks
    ).toBe(27);
  });

  it("6.6 uses 35 max / 3.5 per school", () => {
    const score = scoreCategory(
      makeEntry("6.6", "m1", { schoolsWithinRadius: ["a", "b"] })
    );
    expect(
      score.breakdown.find((r) => r.label === "Nearby schools")?.marks
    ).toBe(28);
  });

  it("map fields carry their deduction config in the category definition", () => {
    const categories = getCategoriesForSubversion("v1", 1) ?? [];
    for (const type of ["6.1", "6.3", "6.5", "6.6"] as const) {
      const category = categories.find((c) => c.type === type);
      const mapField = category?.fields.find((f) => f.type === "map");
      expect(mapField?.key).toBe("schoolsWithinRadius");
    }
    const c61 = categories
      .find((c) => c.type === "6.1")
      ?.fields.find((f) => f.type === "map");
    expect(c61?.mapConfig).toStrictEqual({
      maxMarks: 50,
      pointsPerSchool: 5,
    });
  });
});

// ─── Category scoring (g1 formulas) ─────────────────────────────────────────

describe("scoreCategory — g1 formulas", () => {
  it("6.1 scores main document by deed age", () => {
    const deed2020 = scoreCategory(
      makeEntry("6.1", "d1", {
        mainDocumentType: "title-deed-applicant",
        deedTransferDate: "2018-01-01",
      })
    );
    expect(deed2020.breakdown[0]).toStrictEqual({
      label: "Main residence document",
      marks: 20,
      max: 20,
    });

    const recentDeed = scoreCategory(
      makeEntry("6.1", "d2", {
        mainDocumentType: "title-deed-applicant",
        deedTransferDate: new Date().toISOString().slice(0, 10),
      })
    );
    // A deed transferred today is < 6 months old → minimum weight 0.05 → 20 * 0.05 = 1.
    expect(recentDeed.breakdown[0]?.marks).toBe(1);
  });

  it("6.1 caps electoral register at 25 (2.5 per person-year)", () => {
    const years = electoralRegisterYears();
    const score = scoreCategory(
      makeEntry("6.1", "e1", {
        electoralMotherYears: years,
        electoralFatherYears: years,
      })
    );
    // (5 + 5) * 2.5 = 25
    expect(
      score.breakdown.find((r) => r.label === "Electoral register")?.marks
    ).toBe(25);
  });

  it("6.2 scores O/L by grade-rate ceilings", () => {
    // 9 subjects: S=4, C=6, B=8, A=10 ceilings; 3 B grades → 3 * (8/9) = 2.67
    const score = scoreCategory(
      makeEntry("6.2", "ol1", { olSubjectCount: 9, olGradeB: 3 })
    );
    expect(score.breakdown.find((r) => r.label === "G.C.E. (O/L)")?.marks).toBe(
      2.67
    );
  });

  it("6.3 scores sibling grades at 2 per grade capped at 20", () => {
    const score = scoreCategory(
      makeEntry("6.3", "s1", { siblingGradesCompletedCount: 12 })
    );
    expect(
      score.breakdown.find((r) => r.label === "Grades completed by sibling")
        ?.marks
    ).toBe(20);
  });

  it("6.4 zeroes the category when the 7.5.1 contribution gate fails", () => {
    // Default path is institution; no service start date → 0 contribution → gate closed.
    const score = scoreCategory(
      makeEntry("6.4", "g1", { serviceStartDate: "2000-01-01" })
    );
    expect(score.total).toBe(0);
  });

  it("6.4 scores contribution for institution path", () => {
    // 2 whole years + no bonus at same school → 2 * 2 = 4
    const twoYearsAgo = new Date();
    twoYearsAgo.setUTCFullYear(twoYearsAgo.getUTCFullYear() - 2);
    const score = scoreCategory(
      makeEntry("6.4", "g2", {
        contributionPath: "institution",
        contributionSameSchool: true,
        contributionServiceStartDate: twoYearsAgo.toISOString().slice(0, 10),
      })
    );
    expect(
      score.breakdown.find(
        (r) => r.label === "Contribution to school education"
      )?.marks
    ).toBe(4);
  });

  it("6.5 scores distance tiers", () => {
    const score = scoreCategory(
      makeEntry("6.5", "t1", { previousWorkplaceDistanceKm: 160 })
    );
    expect(
      score.breakdown.find(
        (r) => r.label === "Previous-to-new workplace distance"
      )?.marks
    ).toBe(35);
  });

  it("6.6 scores purpose marks", () => {
    const score = scoreCategory(
      makeEntry("6.6", "f1", { employmentPurpose: "diplomatic" })
    );
    expect(
      score.breakdown.find((r) => r.label === "Employment purpose")?.marks
    ).toBe(40);
  });

  it("unknown category types score zero", () => {
    const score = scoreCategory(makeEntry("6.9", "u1"));
    expect(score.total).toBe(0);
    expect(score.breakdown).toStrictEqual([]);
  });
});

// ─── scoreApplication ────────────────────────────────────────────────────────

describe(scoreApplication, () => {
  it("sums per-entry scores", () => {
    const { total, perEntry } = scoreApplication([
      makeEntry("6.1", "a1", { mainDocumentType: "other-documents" }),
      makeEntry("6.6", "a2", {
        employmentPurpose: "employment",
        abroadStartDate: "2020-01-01",
        abroadEndDate: "2024-01-01",
      }),
    ]);
    expect(perEntry).toHaveLength(2);
    expect(total).toBe(perEntry.reduce((sum, s) => sum + s.total, 0));
  });

  it("handles an empty categories array", () => {
    const { total, perEntry } = scoreApplication([]);
    expect(total).toBe(0);
    expect(perEntry).toHaveLength(0);
  });
});

// ─── Step grouping ──────────────────────────────────────────────────────────

describe("step grouping (g1 application steps)", () => {
  it("categories carry the g1 form steps", () => {
    const categories = getCategoriesForSubversion("v1", 1) ?? [];
    for (const category of categories) {
      expect(category.step).toBe("categories");
    }
  });
});

// ─── Dependency resolution (visibleWhen / clearsOnChange) ───────────────────

describe("marking category field dependencies", () => {
  const categories = getCategoriesForSubversion("v1", 1) ?? [];
  const education = categories.find((c) => c.type === "6.4");

  it("6.4 exists with dependency metadata", () => {
    expect(education).toBeDefined();
    const contributionPath = education?.fields.find(
      (f) => f.key === "contributionPath"
    );
    expect(contributionPath?.clearsOnChange).toContain(
      "contributionServiceStartDate"
    );
  });

  it("disables university-only fields until path is university", () => {
    if (!education) {
      throw new Error("6.4 category missing");
    }
    const states = resolveFieldStates(education.fields, {
      contributionPath: "institution",
    });
    expect(states.contributionExamYears?.disabled).toBeTruthy();
    expect(states.contributionSameSchool?.disabled).toBeFalsy();
  });

  it("disables institution-only fields when path is university", () => {
    if (!education) {
      throw new Error("6.4 category missing");
    }
    const states = resolveFieldStates(education.fields, {
      contributionPath: "university",
    });
    expect(states.contributionSameSchool?.disabled).toBeTruthy();
    expect(states.contributionExamYears?.disabled).toBeFalsy();
  });

  it("disables difficult-service dates until type selected", () => {
    if (!education) {
      throw new Error("6.4 category missing");
    }
    const states = resolveFieldStates(education.fields, {});
    expect(states.difficultServiceStartDate?.disabled).toBeTruthy();
  });

  it("6.2 disables O/L grade inputs until a subject count is chosen", () => {
    const alumni = categories.find((c) => c.type === "6.2");
    if (!alumni) {
      throw new Error("6.2 category missing");
    }
    const states = resolveFieldStates(alumni.fields, {});
    expect(states.olGradeS?.disabled).toBeTruthy();
    const withCount = resolveFieldStates(alumni.fields, {
      olSubjectCount: "9",
    });
    expect(withCount.olGradeS?.disabled).toBeFalsy();
  });
});

// ─── Entry schemas ──────────────────────────────────────────────────────────

describe(buildEntrySchema, () => {
  it("builds a valibot schema accepting valid inputs", async () => {
    const { parse } = await import("valibot");
    const categories = getCategoriesForSubversion("v1", 1) ?? [];
    const siblings = categories.find((c) => c.type === "6.3");
    if (!siblings) {
      throw new Error("6.3 category missing");
    }
    const schema = buildEntrySchema(siblings);
    const result = parse(schema, {
      siblingGradesCompletedCount: 5,
      siblingStudiedAtAppliedSchool: true,
      schoolsWithinRadius: ["a", "b"],
    });
    expect(result).toBeDefined();
  });

  it("rejects wrong-typed inputs", async () => {
    const { safeParse } = await import("valibot");
    const categories = getCategoriesForSubversion("v1", 1) ?? [];
    const siblings = categories.find((c) => c.type === "6.3");
    if (!siblings) {
      throw new Error("6.3 category missing");
    }
    const schema = buildEntrySchema(siblings);
    const result = safeParse(schema, { siblingGradesCompletedCount: "five" });
    expect(result.success).toBeFalsy();
  });
});
