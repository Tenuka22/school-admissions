import { createApplication } from "./create-application";
import { getApplication } from "./get-application";
import { listApplications } from "./list-applications";
import { listVersions } from "./list-versions";
import { updateApplicationData } from "./update-application-data";

export const admissionsRouter = {
  listVersions,
  createApplication,
  getApplication,
  updateApplicationData,
  listApplications,
};
