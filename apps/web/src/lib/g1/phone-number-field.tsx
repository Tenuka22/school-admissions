import type { PhoneNumberValue } from "@school-admissions/db/constants/admissionVersions/index";
import { DEFAULT_PHONE_COUNTRY, phoneNumberFromE164 } from "@school-admissions/db/constants/admissionVersions/index";

import { PhoneInput } from "@/components/reui/phone-input";

export interface PhoneNumberFieldProps {
  id?: string;
  value: PhoneNumberValue | null;
  onChange: (value: PhoneNumberValue | null) => void;
  disabled?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
}

/**
 * Reusable phone number input built on reui's `PhoneInput` (country flag +
 * national number) that outputs a structured `PhoneNumberValue` \u2014 country,
 * calling code and national number kept apart, not one free-typed string \u2014
 * instead of the raw E.164 string the base component works with internally.
 *
 * Editing an existing value round-trips correctly: `value.e164` re-derives
 * the country/national-number split the base component needs to display it.
 */
export function PhoneNumberField({
  id,
  value,
  onChange,
  disabled,
  placeholder,
  ...props
}: PhoneNumberFieldProps) {
  return (
    <PhoneInput
      id={id}
      defaultCountry={DEFAULT_PHONE_COUNTRY}
      value={value?.e164 ?? ""}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e164) => onChange(e164 ? phoneNumberFromE164(e164) : null)}
      {...props}
    />
  );
}
