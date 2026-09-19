export type {
  AdmissionFieldDefinition,
  AdmissionMapFieldConfig,
  AdmissionStepKey,
  AdmissionVersion,
  CoordinateFormat,
  DependencyValue,
  FieldDependencyCondition,
  FieldGate,
  FieldOptionRestriction,
  FieldResolution,
  FieldUiConfig,
  FieldType,
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
  resolveFieldStates,
} from "./shared/types";

export {
  DivisionSchema,
  DistrictSchema,
  DIVISIONS_BY_DISTRICT,
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

export {
  ADMISSION_VERSIONS,
  calculateMigrationRequirements,
  getFieldsChangedBetweenSubversions,
  getFieldsForSubversion,
  getLatestSubversionNumber,
  getSubversionModule,
} from "./builder";
