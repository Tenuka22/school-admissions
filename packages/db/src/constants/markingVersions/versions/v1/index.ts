import type { MarkingVersion } from "../../shared/types";
import { v1_1 } from "./v1.1";

export const v1MarkingVersion: MarkingVersion = {
  key: "v1",
  intakeYear: 2027,
  description: "G1 Marking Scheme — Intake Year 2027",
  subversions: {
    1: v1_1,
  },
};
