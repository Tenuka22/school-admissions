import * as v from "valibot";
import { describe, expect, it } from "vitest";

import {
  ADMISSION_VERSIONS,
  calculateMigrationRequirements,
  getFieldsChangedBetweenSubversions,
  getFieldsForSubversion,
  getLatestSubversionNumber,
  getSubversionModule,
} from "./builder";
import {
  clearFieldAndDependents,
  groupFields,
  resolveFieldOptions,
  resolveFieldStates,
} from "./shared/types";
import { subversion1Schema } from "./versions/v1/v1.1/schema";

const { v1 } = ADMISSION_VERSIONS;
if (!v1) {
  throw new Error("v1 must be registered");
}

// ─── ADMISSION_VERSIONS registry ────────────────────────────────────────────

describe("ADMISSION_VERSIONS registry", () => {
  it("contains v1", () => {
    expect(v1).toBeDefined();
  });

  it("v1 has correct metadata", () => {
    expect(v1.key).toBe("v1");
    expect(v1.intakeYear).toBe(2027);
  });

  it("v1 has a single complete subversion", () => {
    expect(Object.keys(v1.subversions)).toStrictEqual(["1"]);
  });
});

// ─── getLatestSubversionNumber ──────────────────────────────────────────────

describe(getLatestSubversionNumber, () => {
  it("returns 1 for v1", () => {
    expect(getLatestSubversionNumber("v1")).toBe(1);
  });

  it("returns 0 for unknown version", () => {
    expect(getLatestSubversionNumber("v99")).toBe(0);
  });
});

// ─── getSubversionModule ────────────────────────────────────────────────────

describe(getSubversionModule, () => {
  it("returns subversion 1", () => {
    const mod = getSubversionModule("v1", 1);
    expect(mod).toBeDefined();
    expect(mod?.subversion).toBe(1);
    expect(mod?.description).toContain("Complete G1 2027");
  });

  it("returns latest subversion when omitted", () => {
    const mod = getSubversionModule("v1");
    expect(mod?.subversion).toBe(1);
  });

  it("returns undefined for unknown version", () => {
    expect(getSubversionModule("v99", 1)).toBeUndefined();
  });

  it("returns undefined for missing subversion", () => {
    expect(getSubversionModule("v1", 99)).toBeUndefined();
  });
});

// ─── getFieldsForSubversion ─────────────────────────────────────────────────

describe(getFieldsForSubversion, () => {
  it("returns the complete g1 form: 29 fields", () => {
    const fields = getFieldsForSubversion("v1", 1);
    expect(fields).toHaveLength(29);
  });

  it("every field carries a valid step", () => {
    const fields = getFieldsForSubversion("v1", 1) ?? [];
    for (const field of fields) {
      expect([
        "location",
        "applicant",
        "guardian",
        "residence",
        "categories",
        "declaration",
        "review",
      ]).toContain(field.step);
    }
  });

  it("covers every g1 step", () => {
    const fields = getFieldsForSubversion("v1", 1) ?? [];
    const steps = new Set(fields.map((f) => f.step));
    expect(steps.has("location")).toBeTruthy();
    expect(steps.has("applicant")).toBeTruthy();
    expect(steps.has("guardian")).toBeTruthy();
    expect(steps.has("residence")).toBeTruthy();
    expect(steps.has("declaration")).toBeTruthy();
  });

  it("returns undefined for unknown version", () => {
    expect(getFieldsForSubversion("v99", 1)).toBeUndefined();
  });

  it("returns undefined for missing subversion", () => {
    expect(getFieldsForSubversion("v1", 99)).toBeUndefined();
  });
});

// ─── calculateMigrationRequirements ─────────────────────────────────────────

describe(calculateMigrationRequirements, () => {
  it("returns empty for same subversion", () => {
    const result = calculateMigrationRequirements("v1", 1, 1);
    expect(result.newFields).toHaveLength(0);
    expect(result.newlyRequired).toHaveLength(0);
    expect(result.removedFieldKeys).toHaveLength(0);
  });

  it("throws for unknown version", () => {
    expect(() => calculateMigrationRequirements("v99", 1, 1)).toThrow(
      "Version 'v99' not found"
    );
  });
});

// ─── getFieldsChangedBetweenSubversions ─────────────────────────────────────

describe(getFieldsChangedBetweenSubversions, () => {
  it("returns empty for same subversion", () => {
    const result = getFieldsChangedBetweenSubversions("v1", 1, 1);
    expect(result.newFields).toHaveLength(0);
    expect(result.newlyRequired).toHaveLength(0);
  });

  it("returns empty for unknown version", () => {
    const result = getFieldsChangedBetweenSubversions("v99", 1, 1);
    expect(result.newFields).toHaveLength(0);
    expect(result.newlyRequired).toHaveLength(0);
  });
});

// ─── Schema validation ─────────────────────────────────────────────────────

describe("subversion schemas", () => {
  const validData = {
    fullName: "Nimal Perera",
    sinhalaName: "නිමල් පෙරේරා",
    gender: "Male" as const,
    religion: "Buddhist" as const,
    educationMedium: "Sinhala" as const,
    dateOfBirth: "2021-06-15",
    birthCertificateNumber: "BC12345",
    guardianRelationship: "Mother" as const,
    guardianFullName: "Kamala Perera",
    guardianSinhalaName: "කමලා පෙරේරා",
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

  it("accepts valid complete data", () => {
    const result = v.safeParse(subversion1Schema, validData);
    expect(result.success).toBeTruthy();
  });

  it("rejects empty fullName", () => {
    const result = v.safeParse(subversion1Schema, {
      ...validData,
      fullName: "",
    });
    expect(result.success).toBeFalsy();
  });

  it("rejects invalid gender", () => {
    const result = v.safeParse(subversion1Schema, {
      ...validData,
      gender: "Other",
    });
    expect(result.success).toBeFalsy();
  });

  it("rejects invalid religion (g1 uses 'Buddhist', not 'Buddhism')", () => {
    const result = v.safeParse(subversion1Schema, {
      ...validData,
      religion: "Buddhism",
    });
    expect(result.success).toBeFalsy();
  });

  it("rejects invalid NIC", () => {
    const result = v.safeParse(subversion1Schema, {
      ...validData,
      guardianNic: "12345",
    });
    expect(result.success).toBeFalsy();
  });

  it("accepts 12-digit NIC", () => {
    const result = v.safeParse(subversion1Schema, {
      ...validData,
      guardianNic: "199012345678",
    });
    expect(result.success).toBeTruthy();
  });

  it("rejects invalid guardian email", () => {
    const result = v.safeParse(subversion1Schema, {
      ...validData,
      guardianEmail: "not-an-email",
    });
    expect(result.success).toBeFalsy();
  });

  it("rejects invalid district", () => {
    const result = v.safeParse(subversion1Schema, {
      ...validData,
      district: "colombo",
    });
    expect(result.success).toBeFalsy();
  });

  it("accepts any valid division at the schema layer (g1 parity) — cross-district pairing is prevented by the cascading options, not the schema", () => {
    // g1's zod schema validates district/division as independent strings;
    // the district → division filtering happens in resolveFieldOptions.
    const result = v.safeParse(subversion1Schema, {
      ...validData,
      division: "matara-ds",
    });
    expect(result.success).toBeTruthy();
  });

  it("rejects declaration not confirmed (literal true)", () => {
    const result = v.safeParse(subversion1Schema, {
      ...validData,
      declarationConfirmed: false,
    });
    expect(result.success).toBeFalsy();
  });
});

// ─── Field definitions & steps ──────────────────────────────────────────────

describe("field definitions & steps", () => {
  it("each subversion module has fields and a schema", () => {
    for (const sub of Object.values(v1.subversions)) {
      expect(sub.fields).toBeDefined();
      expect(Array.isArray(sub.fields)).toBeTruthy();
      expect(sub.fields.length).toBeGreaterThan(0);
      expect(sub.schema).toBeDefined();
    }
  });

  it("subversion 1 has no delta", () => {
    expect(v1.subversions[1]?.delta).toBeUndefined();
  });

  it("groups fields by step preserving order", () => {
    const fields = getFieldsForSubversion("v1", 1) ?? [];
    const groups = groupFields(fields);
    expect(groups.length).toBeGreaterThan(0);
    // All fields of a group share the same group key.
    for (const group of groups) {
      for (const field of group.fields) {
        expect(field.group).toBe(group.group);
      }
    }
  });

  it("location step contains the map capture fields", () => {
    const fields = getFieldsForSubversion("v1", 1) ?? [];
    const locationKeys = fields
      .filter((f) => f.step === "location")
      .map((f) => f.key);
    expect(locationKeys).toContain("locationLatitude");
    expect(locationKeys).toContain("locationLongitude");
  });

  it("declaration booleans are required", () => {
    const fields = getFieldsForSubversion("v1", 1) ?? [];
    for (const key of ["declarationConfirmed", "declarationConsent"]) {
      const field = fields.find((f) => f.key === key);
      expect(field?.required).toBeTruthy();
    }
  });
});

// ─── Dependency resolution ──────────────────────────────────────────────────

describe("dependency resolution", () => {
  const fields = getFieldsForSubversion("v1", 1) ?? [];

  it("current address is disabled while sameAsPermanent is true", () => {
    const states = resolveFieldStates(fields, { sameAsPermanent: true });
    expect(states.currentAddressEn?.disabled).toBeTruthy();
    expect(states.currentAddressSi?.disabled).toBeTruthy();
  });

  it("current address is enabled once sameAsPermanent is false", () => {
    const states = resolveFieldStates(fields, { sameAsPermanent: false });
    expect(states.currentAddressEn?.disabled).toBeFalsy();
    expect(states.currentAddressSi?.disabled).toBeFalsy();
  });

  it("division options are filtered by the selected district", () => {
    const options = resolveFieldOptions(fields, { district: "matara" });
    expect(options.division).toContain("matara-ds");
    expect(options.division).not.toContain("akmeemana");
  });

  it("changing district clears the selected division", () => {
    const next = clearFieldAndDependents(fields, "district", {
      district: "galle",
      division: "akmeemana",
      gnDivision: "Udugama",
    });
    expect(next.district).toBeNull();
    expect(next.division).toBeNull();
    // gnDivision now cascades from division (GN divisions belong to a DS
    // division), so it clears recursively too instead of surviving stale.
    expect(next.gnDivision).toBeNull();
  });
});
