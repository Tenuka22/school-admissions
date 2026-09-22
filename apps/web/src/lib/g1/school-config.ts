/**
 * Centralised school-specific configuration.
 *
 * Change `HOME_SCHOOL_ID` when deploying this app for a different school.
 * Components should import from here rather than hardcoding a school id.
 *
 * Ported from aloysius-g1's `apps/web/src/lib/g1/school-config.ts` \u2014 the
 * proximity criterion there draws its radius from the applicant's home to
 * this exact school (see `compatibleSchoolsWithinRadius` in
 * `@school-admissions/db/constants/schools`), not a fixed per-category
 * number, so this id is load-bearing for every category's "Nearby Schools"
 * field, not just display text.
 */
import { SCHOOL_CATALOG } from "@school-admissions/db/constants/schools/index";

/** Ministry school_id (from apps/school_scraper's source CSV) for St. Aloysius' College, Galle. */
export const HOME_SCHOOL_ID = "0701006";

export function getHomeSchool() {
  return SCHOOL_CATALOG.find((school) => school.id === HOME_SCHOOL_ID);
}

export function getHomeSchoolDisplayName(): string {
  return getHomeSchool()?.name ?? "this school";
}
