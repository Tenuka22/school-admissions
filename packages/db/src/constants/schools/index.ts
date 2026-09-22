import catalogData from "./catalog.json";

/**
 * A government school with a real, Google-Maps-verified location.
 *
 * Sourced from `apps/school_scraper` (Scrapling + Google Maps against the
 * Ministry's national school listing CSV) — `id` is the Ministry's
 * `school_id` from that listing, `lat`/`lng` come straight off the matched
 * Google Maps place pin. Regenerate this file with:
 *
 * ```sh
 * cd apps/school_scraper
 * uv run school-scraper --district Galle --export-catalog ../../packages/db/src/constants/schools/catalog.json
 * ```
 *
 * (swap `--district`/`--province` for whatever's been scraped, or drop the
 * filter entirely once the full national listing is scraped).
 */
export interface SchoolCatalogEntry {
  /** Ministry school_id from the source CSV listing (e.g. "0710001"). */
  id: string;
  /** Google Maps' display name for the place (nicely cased, unlike the source CSV's all-caps name). */
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  district: string | null;
  division: string | null;
  /** Raw Ministry CSV value ("Male" | "Female" | "Mixed"), null if unscraped. Used for gender-compatible proximity filtering. */
  sex: string | null;
  zone: string | null;
  /** Language(s) of instruction, e.g. "Sinhala/ English". */
  medium: string | null;
  /** Ministry school category, e.g. "1AB", "1C", "Type 2". */
  schoolCategory: string | null;
  /** e.g. "Grade 1-13". */
  gradeSpan: string | null;
  /** e.g. "National", "Provincial". */
  governmentType: string | null;
  totalStudents: number | null;
  phone: string | null;
  website: string | null;
  /** Google Maps place URL, for "open in Maps" links. */
  mapUrl: string | null;
}

export const SCHOOL_CATALOG: readonly SchoolCatalogEntry[] = catalogData;

/** A catalog school paired with its great-circle distance from a query point. */
export interface SchoolWithDistance {
  school: SchoolCatalogEntry;
  distanceKm: number;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two lat/lng points, in kilometres. */
export function haversineDistanceKm(a: [number, number], b: [number, number]): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLng * sinLng;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Catalog schools within `radiusKm` of `point`, nearest first. */
export function schoolsNear(point: [number, number], radiusKm: number): SchoolWithDistance[] {
  return SCHOOL_CATALOG.map((school) => ({ school, distanceKm: haversineDistanceKm(point, [school.lat, school.lng]) }))
    .filter(({ distanceKm }) => distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Whether a school's gender intake can compete with a target school's, for
 * proximity purposes: a boys' school never treats a girls'-only school as a
 * nearby alternative (an applicant to a boys' school couldn't have gone
 * there anyway), and vice versa. "Mixed" schools are always compatible with
 * everything, in both directions. Unknown (`null`) sex is treated as
 * compatible rather than silently excluding unscraped schools.
 */
export function isGenderCompatible(schoolSex: string | null, targetSex: string | null): boolean {
  if (!schoolSex || !targetSex || targetSex === "Mixed") {
    return true;
  }
  return schoolSex === targetSex || schoolSex === "Mixed";
}

/** Every catalog school's distance from `point`, nearest first (no radius filter). */
export function allSchoolsWithDistance(point: [number, number]): SchoolWithDistance[] {
  return SCHOOL_CATALOG.map((school) => ({ school, distanceKm: haversineDistanceKm(point, [school.lat, school.lng]) })).sort(
    (a, b) => a.distanceKm - b.distanceKm
  );
}

export interface CompatibleSchoolsResult {
  /** The target school the radius was measured against, or null if `targetId` isn't in the catalog. */
  target: SchoolCatalogEntry | null;
  /** Distance from `home` to the target school, in km \u2014 the auto-derived proximity radius. */
  radiusKm: number;
  /** Every OTHER gender-compatible catalog school at least as close to `home` as the target, nearest first. */
  schools: SchoolWithDistance[];
}

/**
 * The objective, non-gameable proximity criterion: draws the radius from the
 * applicant's home to the school they're actually applying to (`targetId`),
 * then returns every OTHER gender-compatible school at least as close as
 * that - i.e. "how many reasonably-reachable alternatives did this
 * applicant have". No fixed/manually-tuned radius, and the target school
 * itself is never included in its own result.
 */
export function compatibleSchoolsWithinRadius(home: [number, number], targetId: string): CompatibleSchoolsResult {
  const target = SCHOOL_CATALOG.find((school) => school.id === targetId) ?? null;
  if (!target) {
    return { target: null, radiusKm: 0, schools: [] };
  }
  const radiusKm = haversineDistanceKm(home, [target.lat, target.lng]);
  const schools = allSchoolsWithDistance(home)
    .filter(({ school }) => school.id !== targetId)
    .filter(({ distanceKm }) => distanceKm <= radiusKm)
    .filter(({ school }) => isGenderCompatible(school.sex, target.sex));
  return { target, radiusKm, schools };
}
