import {
  ADMISSION_VERSIONS,
  getLatestSubversionNumber,
} from "@school-admissions/db/constants/admissionVersions/index";

import { publicProcedure } from "../../index";

export const listVersions = publicProcedure.handler(() =>
  Object.values(ADMISSION_VERSIONS).map((v) => ({
    key: v.key,
    description: v.description,
    intakeYear: v.intakeYear,
    latestSubversion: getLatestSubversionNumber(v.key),
    subversionCount: Object.keys(v.subversions).length,
  }))
);
