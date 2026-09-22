export type {
  AdmissionFieldDefinition,
  AdmissionMapFieldConfig,
  AdmissionStepKey,
  AdmissionVersion,
  CoordinateFormat,
  DependencyValue,
  FieldDateRangeRule,
  FieldDependencyCondition,
  FieldGate,
  FieldOptionRestriction,
  FieldRule,
  FieldResolution,
  FieldUiConfig,
  FieldType,
  FieldValidatorRule,
  LocationCaptureConfig,
  SubversionAction,
  SubversionDelta,
  SubversionModule,
} from "./shared/types";

export {
  ADMISSION_STEPS,
  clearFieldAndDependents,
  groupFields,
  resolveFieldOptions,
  resolveFieldErrors,
  resolveFieldStates,
} from "./shared/types";

export {
  DivisionSchema,
  DistrictSchema,
  DIVISIONS_BY_DISTRICT,
  DISTRICT_LABELS,
  DIVISION_LABELS,
  ELECTORAL_DISTRICTS,
  GN_DIVISIONS_BY_DIVISION,
  lookupLabel,
} from "./shared/divisions";
export type { Division, District } from "./shared/divisions";

export {
  EducationMediumSchema,
  GenderSchema,
  GuardianRelationshipSchema,
  LocationSourceSchema,
  ReligionSchema,
} from "./shared/enums";
export type {
  EducationMedium,
  Gender,
  GuardianRelationship,
  LocationSource,
  Religion,
} from "./shared/enums";

export { isValidSriLankanNic, parseSriLankanNic } from "./shared/nic";
export type { ParsedNic } from "./shared/nic";

export {
  DEFAULT_PHONE_COUNTRY,
  isValidPhoneNumberValue,
  PhoneNumberSchema,
  phoneNumberFromE164,
} from "./shared/phone";
export type { PhoneNumber, PhoneNumberValue } from "./shared/phone";

export {
  ADMISSION_VERSIONS,
  calculateMigrationRequirements,
  getFieldsChangedBetweenSubversions,
  getFieldsForSubversion,
  getLatestSubversionNumber,
  getSubversionModule,
} from "./builder";
