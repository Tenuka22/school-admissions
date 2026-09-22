export type LatHemisphere = "N" | "S";
export type LngHemisphere = "E" | "W";

export interface Dms {
  degrees: number;
  minutes: number;
  seconds: number;
}

/** Splits a decimal degree value into whole degrees/minutes/seconds (always non-negative — sign lives in the hemisphere). */
export function decimalToDms(value: number): Dms {
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutesFull = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFull);
  const seconds = (minutesFull - minutes) * 60;
  return { degrees, minutes, seconds };
}

export function latitudeHemisphere(value: number): LatHemisphere {
  return value < 0 ? "S" : "N";
}

export function longitudeHemisphere(value: number): LngHemisphere {
  return value < 0 ? "W" : "E";
}

/** Combines degrees/minutes/seconds and a hemisphere back into a signed decimal degree value. */
export function dmsToDecimal(dms: Dms, hemisphere: LatHemisphere | LngHemisphere): number {
  const magnitude = dms.degrees + dms.minutes / 60 + dms.seconds / 3600;
  return hemisphere === "S" || hemisphere === "W" ? -magnitude : magnitude;
}

export function formatDms(value: number, hemisphere: LatHemisphere | LngHemisphere): string {
  const dms = decimalToDms(value);
  return `${dms.degrees}\u00b0 ${dms.minutes}' ${dms.seconds.toFixed(2)}" ${hemisphere}`;
}

export interface ParsedDmsComponent {
  degrees: number;
  minutes: number;
  seconds: number;
  /** Present when the pasted text carried a hemisphere letter (e.g. "N" in `6\u00b003'14.42"N`). */
  hemisphere?: LatHemisphere | LngHemisphere;
  /** True when the text carried a leading `-` instead of a hemisphere letter. */
  negative: boolean;
}

// Matches one `D\u00b0M'S"H` component, e.g. `6\u00b003'14.42"N` or `-80\u00b012'39.54"`.
// Minute/second marks accept the straight ASCII forms as well as the prime (\u2032/\u2033)
// and curly-quote (\u2019/\u201d) forms phones and word processors tend to autocorrect to.
// The degree symbol itself is optional \u2014 some clipboards drop it \u2014 provided the
// degrees and minutes are still separated by whitespace instead.
const DMS_COMPONENT_RE =
  /(-)?\s*(\d{1,3}(?:\.\d+)?)(?:\s*\u00b0\s*|\s+)(\d{1,2}(?:\.\d+)?)\s*['\u2032\u2019]\s*(\d{1,2}(?:\.\d+)?)\s*(?:["\u2033\u201d])?\s*([NSEWnsew])?/g;

/**
 * Pulls every `D\u00b0M'S"H` component out of free-form pasted text (e.g. from Google Maps:
 * `6\u00b003'14.42"N 80\u00b012'39.54"E`). Returns them in the order found so callers can match
 * them up to latitude/longitude by hemisphere letter or position.
 */
export function extractDmsComponents(text: string): ParsedDmsComponent[] {
  const results: ParsedDmsComponent[] = [];
  for (const match of text.matchAll(DMS_COMPONENT_RE)) {
    const [, sign, degrees, minutes, seconds, hemisphere] = match;
    results.push({
      degrees: Number(degrees),
      minutes: Number(minutes),
      seconds: Number(seconds),
      hemisphere: hemisphere ? (hemisphere.toUpperCase() as LatHemisphere | LngHemisphere) : undefined,
      negative: sign === "-",
    });
  }
  return results;
}

export interface ParsedDmsPair {
  lat: number;
  lng: number;
}

/**
 * Parses a whole "latitude, longitude" DMS string \u2014 as copied straight off
 * Google Maps, e.g. `6\u00b003'14.42"N 80\u00b012'39.54"E` \u2014 into decimal degrees.
 * Components are matched to an axis by hemisphere letter (N/S \u2192 lat, E/W \u2192 lng)
 * when present, falling back to positional order. Returns `null` unless both
 * axes were found.
 */
export function parseDmsPair(text: string): ParsedDmsPair | null {
  const components = extractDmsComponents(text);
  if (components.length < 2) {
    return null;
  }
  let latComponent = components.find((c) => c.hemisphere === "N" || c.hemisphere === "S");
  let lngComponent = components.find((c) => c.hemisphere === "E" || c.hemisphere === "W");
  if (!latComponent && !lngComponent) {
    [latComponent, lngComponent] = components;
  } else {
    latComponent ??= components.find((c) => c !== lngComponent);
    lngComponent ??= components.find((c) => c !== latComponent);
  }
  if (!latComponent || !lngComponent) {
    return null;
  }
  const toDecimal = (component: ParsedDmsComponent, negativeHemisphere: LatHemisphere | LngHemisphere) => {
    const magnitude = component.degrees + component.minutes / 60 + component.seconds / 3600;
    const negative = component.hemisphere ? component.hemisphere === negativeHemisphere : component.negative;
    return negative ? -magnitude : magnitude;
  };
  return { lat: toDecimal(latComponent, "S"), lng: toDecimal(lngComponent, "W") };
}
