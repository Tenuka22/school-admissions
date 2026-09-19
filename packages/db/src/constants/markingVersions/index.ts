export type {
  MarkingCategoryAction,
  MarkingCategoryDefinition,
  MarkingCategoryEntry,
  MarkingCategoryType,
  MarkingFieldDefinition,
  MarkingMapFieldConfig,
  MarkingStepKey,
  MarkingSubversionDelta,
  MarkingSubversionModule,
  MarkingVersion,
} from "./shared/types";

export {
  MARKING_CATEGORY_TYPES,
  MARKING_STEPS,
  clearFieldAndDependents,
  groupFields,
  resolveFieldOptions,
  resolveFieldStates,
} from "./shared/types";

export {
  buildEntrySchema,
  validateCategoryEntries,
} from "./shared/entry-schema";

export {
  CATEGORY_MAX_MARKS,
  electoralRegisterYears,
} from "./shared/marking-scheme";

export {
  scoreApplication,
  scoreCategory,
  scoreCategory61,
  scoreCategory62,
  scoreCategory63,
  scoreCategory64,
  scoreCategory65,
  scoreCategory66,
} from "./shared/scoring";

export {
  MARKING_VERSIONS,
  calculateMarkingMigrationRequirements,
  getCategoriesForSubversion,
  getLatestMarkingSubversionNumber,
  getMarkingSubversionModule,
} from "./builder";
