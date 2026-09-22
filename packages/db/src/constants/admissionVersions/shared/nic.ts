/**
 * Sri Lankan National Identity Card number validation.
 *
 * Two formats are in circulation:
 * - Old (pre-2016): 9 digits + a trailing `V`/`X` \u2014 `YY DDD SSSS` + letter.
 * - New (2016 onward): 12 digits \u2014 `YYYY DDD SSSSS`.
 *
 * In both formats `DDD` is the day of the year the holder was born on
 * (001\u2013366), with 500 added for female holders (501\u2013866) \u2014 per the Registrar
 * General's Department numbering scheme. A NIC is only structurally valid if
 * that day-of-year actually exists for the encoded birth year (leap years
 * allow day 366).
 */

export interface ParsedNic {
  format: "old" | "new";
  gender: "male" | "female";
  /** Birth date the NIC encodes, as an ISO `YYYY-MM-DD` string. */
  dateOfBirth: string;
}

const OLD_NIC_RE = /^(\d{2})(\d{3})(\d{4})[VvXx]$/u;
const NEW_NIC_RE = /^(\d{4})(\d{3})(\d{5})$/u;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function resolveBirthDate(year: number, encodedDay: number): { dateOfBirth: string; gender: "male" | "female" } | null {
  const isFemale = encodedDay > 500;
  const dayOfYear = isFemale ? encodedDay - 500 : encodedDay;
  const daysInYear = isLeapYear(year) ? 366 : 365;
  if (dayOfYear < 1 || dayOfYear > daysInYear) {
    return null;
  }
  const dateOfBirth = new Date(Date.UTC(year, 0, dayOfYear)).toISOString().slice(0, 10);
  return { dateOfBirth, gender: isFemale ? "female" : "male" };
}

/** Parses and validates a Sri Lankan NIC, returning what it encodes or `null` if invalid. */
export function parseSriLankanNic(rawValue: string): ParsedNic | null {
  const value = rawValue.trim();

  const oldMatch = OLD_NIC_RE.exec(value);
  if (oldMatch) {
    const [, yy, ddd] = oldMatch;
    // Old-format NICs predate the 2016 reform, so the two-digit year is
    // always read as 19xx here \u2014 true for every holder old enough to be a
    // guardian on this form.
    const resolved = resolveBirthDate(1900 + Number(yy), Number(ddd));
    return resolved ? { format: "old", ...resolved } : null;
  }

  const newMatch = NEW_NIC_RE.exec(value);
  if (newMatch) {
    const [, yyyy, ddd] = newMatch;
    const resolved = resolveBirthDate(Number(yyyy), Number(ddd));
    return resolved ? { format: "new", ...resolved } : null;
  }

  return null;
}

export function isValidSriLankanNic(value: string): boolean {
  return parseSriLankanNic(value) !== null;
}
