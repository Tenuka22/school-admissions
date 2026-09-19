import type { MarkingSubversionModule } from "../../../shared/types";
import { subversion1Categories } from "./categories";
import { subversion1Delta } from "./delta";

export const v1_1: MarkingSubversionModule = {
  subversion: 1,
  description:
    "Complete G1 2027 scheme — all 6 circular categories (6.1–6.6) with step groupings and map-proximity deduction",
  createdAt: "2026-09-18T00:00:00.000Z",
  categories: subversion1Categories,
  delta: subversion1Delta,
};
