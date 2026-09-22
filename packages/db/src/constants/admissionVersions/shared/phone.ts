import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import * as v from "valibot";

/**
 * A phone number captured with its country code kept separate from the
 * national number, instead of one free-typed string — the format the
 * `PhoneInput` component (packages/db/../../apps/web/src/components/reui)
 * outputs and the shape persisted in `guardianPhone` / `guardianWhatsapp`.
 */
export interface PhoneNumberValue {
  /** ISO 3166-1 alpha-2 country, e.g. "LK". */
  country: string;
  /** Country calling code without the leading `+`, e.g. "94". */
  countryCallingCode: string;
  /** National significant number, digits only, e.g. "701911350". */
  nationalNumber: string;
  /** Full E.164 number, e.g. "+94701911350" \u2014 what's actually validated. */
  e164: string;
}

/** Builds a `PhoneNumberValue` from an E.164 string, or `null` if it doesn't parse. */
export function phoneNumberFromE164(e164: string): PhoneNumberValue | null {
  try {
    const parsed = parsePhoneNumber(e164);
    if (!parsed) {
      return null;
    }
    return {
      country: parsed.country ?? "",
      countryCallingCode: parsed.countryCallingCode,
      nationalNumber: parsed.nationalNumber,
      e164: parsed.number,
    };
  } catch {
    return null;
  }
}

/** Sri Lanka is this form's default and overwhelmingly common country. */
export const DEFAULT_PHONE_COUNTRY: CountryCode = "LK";

export const PhoneNumberSchema = v.pipe(
  v.object({
    country: v.string(),
    countryCallingCode: v.string(),
    nationalNumber: v.pipe(v.string(), v.nonEmpty("Phone number is required")),
    e164: v.string(),
  }),
  v.check(
    (value) => isValidPhoneNumber(value.e164),
    "Enter a valid phone number"
  )
);
export type PhoneNumber = v.InferOutput<typeof PhoneNumberSchema>;

/** Type guard + validity check for use in a field's `validator` rule, where the value is `unknown`. */
export function isValidPhoneNumberValue(value: unknown): value is PhoneNumberValue {
  if (typeof value !== "object" || value === null || !("e164" in value)) {
    return false;
  }
  const { e164 } = value;
  return typeof e164 === "string" && isValidPhoneNumber(e164);
}
