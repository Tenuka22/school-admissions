import {
  DIVISIONS_BY_DISTRICT,
  DivisionSchema,
  DistrictSchema,
} from "../../../shared/divisions";
import type { AdmissionFieldDefinition } from "../../../shared/types";

/** Cascading-select mapping: district → its DS divisions. */
const DISTRICT_TO_DIVISIONS: Record<string, string[]> = {
  galle: [...DIVISIONS_BY_DISTRICT.galle],
  matara: [...DIVISIONS_BY_DISTRICT.matara],
  hambantota: [...DIVISIONS_BY_DISTRICT.hambantota],
};

/**
 * Complete G1 2027 admission fields — every field of the source aloysius-g1
 * application form, grouped by the form's steps (location → applicant →
 * guardian → residence → categories → declaration → review). The `map`
 * field carries the proximity config the marking system deducts from; the
 * residence selects cascade (district → division).
 */
export const subversion1Fields: AdmissionFieldDefinition[] = [
  // ── Step: location (map capture) ────────────────────────────────────────
  {
    key: "locationLabel",
    label: "Location Label",
    type: "text",
    required: false,
    step: "location",
    group: "Selected Location",
    // Nothing to type — written by the capture controls (GPS / manual entry /
    // map pin), so it renders as a read-only line, not an input.
    ui: {
      readOnly: true,
      description: "Set automatically when you capture your location.",
    },
  },
  {
    key: "locationAddress",
    label: "Location Address",
    type: "text",
    required: false,
    step: "location",
    group: "Selected Location",
  },
  {
    key: "locationLatitude",
    label: "Latitude",
    type: "number",
    required: false,
    step: "location",
    group: "Selected Location",
    // Written by the map pin / GPS / manual-entry controls — the coordinate
    // readout labels it, so the field renders without its own label.
    ui: { showLabel: false },
  },
  {
    key: "locationLongitude",
    label: "Longitude",
    type: "number",
    required: false,
    step: "location",
    group: "Selected Location",
    ui: { showLabel: false },
  },
  {
    key: "locationSource",
    label: "Location Source",
    type: "select",
    required: false,
    step: "location",
    group: "Selected Location",
    options: ["manual", "device", "map", "network", "admin"],
  },

  // ── Step: applicant ─────────────────────────────────────────────────────
  {
    key: "fullName",
    label: "Full Name",
    type: "text",
    required: true,
    step: "applicant",
    group: "Applicant Details",
  },
  {
    key: "sinhalaName",
    label: "Full Name (Sinhala)",
    type: "text",
    required: true,
    step: "applicant",
    group: "Applicant Details",
  },
  {
    key: "gender",
    label: "Gender",
    type: "select",
    required: true,
    step: "applicant",
    group: "Applicant Details",
    options: ["Female", "Male"],
  },
  {
    key: "religion",
    label: "Religion",
    type: "select",
    required: true,
    step: "applicant",
    group: "Applicant Details",
    options: ["Catholic", "Christian", "Buddhist", "Islam", "Hindu"],
  },
  {
    key: "educationMedium",
    label: "Education Medium",
    type: "select",
    required: true,
    step: "applicant",
    group: "Applicant Details",
    options: ["Sinhala", "Tamil"],
  },
  {
    key: "dateOfBirth",
    label: "Date of Birth",
    type: "date",
    required: true,
    step: "applicant",
    group: "Applicant Details",
  },
  {
    key: "birthCertificateNumber",
    label: "Birth Certificate Number",
    type: "text",
    required: true,
    step: "applicant",
    group: "Applicant Details",
  },

  // ── Step: guardian ──────────────────────────────────────────────────────
  {
    key: "guardianRelationship",
    label: "Relationship",
    type: "select",
    required: true,
    step: "guardian",
    group: "Parent / Guardian Details",
    options: ["Mother", "Father", "Guardian"],
  },
  {
    key: "guardianFullName",
    label: "Full Name",
    type: "text",
    required: true,
    step: "guardian",
    group: "Parent / Guardian Details",
  },
  {
    key: "guardianSinhalaName",
    label: "Full Name (Sinhala)",
    type: "text",
    required: true,
    step: "guardian",
    group: "Parent / Guardian Details",
  },
  {
    key: "guardianNic",
    label: "NIC Number",
    type: "text",
    required: true,
    step: "guardian",
    group: "Parent / Guardian Details",
  },
  {
    key: "guardianPhone",
    label: "Phone Number",
    type: "text",
    required: true,
    step: "guardian",
    group: "Parent / Guardian Details",
  },
  {
    key: "guardianEmail",
    label: "Email (optional)",
    type: "text",
    required: false,
    step: "guardian",
    group: "Parent / Guardian Details",
  },

  // ── Step: residence ─────────────────────────────────────────────────────
  {
    key: "permanentAddressEn",
    label: "Permanent Address (English)",
    type: "text",
    required: true,
    step: "residence",
    group: "Permanent Address",
  },
  {
    key: "permanentAddressSi",
    label: "Permanent Address (Sinhala)",
    type: "text",
    required: true,
    step: "residence",
    group: "Permanent Address",
  },
  {
    key: "currentAddressEn",
    label: "Current Address (English)",
    type: "text",
    required: true,
    step: "residence",
    group: "Current Address",
    visibleWhen: [{ field: "sameAsPermanent", in: [false] }],
  },
  {
    key: "currentAddressSi",
    label: "Current Address (Sinhala)",
    type: "text",
    required: true,
    step: "residence",
    group: "Current Address",
    visibleWhen: [{ field: "sameAsPermanent", in: [false] }],
  },
  {
    key: "sameAsPermanent",
    label: "Current Address Same as Permanent",
    type: "boolean",
    required: false,
    step: "residence",
    group: "Current Address",
    clearsOnChange: ["currentAddressEn", "currentAddressSi"],
  },
  {
    key: "district",
    label: "District",
    type: "select",
    required: true,
    step: "residence",
    group: "Administrative Divisions",
    enumSchema: DistrictSchema,
    restrictsOptions: [
      {
        field: "division",
        optionsByValue: DISTRICT_TO_DIVISIONS,
      },
    ],
    clearsOnChange: ["division"],
  },
  {
    key: "division",
    label: "Divisional Secretariat Division",
    type: "select",
    required: true,
    step: "residence",
    group: "Administrative Divisions",
    enumSchema: DivisionSchema,
  },
  {
    key: "gnDivision",
    label: "Grama Niladhari Division",
    type: "text",
    required: true,
    step: "residence",
    group: "Administrative Divisions",
  },
  {
    key: "electoralDistrict",
    label: "Electoral District",
    type: "text",
    required: true,
    step: "residence",
    group: "Administrative Divisions",
  },

  // ── Step: declaration ───────────────────────────────────────────────────
  {
    key: "declarationConfirmed",
    label: "Accuracy Confirmed",
    type: "boolean",
    required: true,
    step: "declaration",
    group: "Declaration",
  },
  {
    key: "declarationConsent",
    label: "Consent Given",
    type: "boolean",
    required: true,
    step: "declaration",
    group: "Declaration",
  },
];
