import type { SubversionDelta } from "../../../shared/types";
import { isValidPhoneNumberValue } from "../../../shared/phone";

/**
 * v1.2 adds a single optional field — a guardian WhatsApp number, distinct
 * from `guardianPhone` (some guardians use a different number for WhatsApp
 * than their primary contact number). Nothing else changes.
 */
export const subversion2Delta: SubversionDelta = {
  added: [
    {
      key: "guardianWhatsapp",
      label: "WhatsApp Number",
      type: "phone",
      required: false,
      step: "guardian",
      group: "Parent / Guardian Details",
      rules: [
        { kind: "validator", validate: isValidPhoneNumberValue, message: "Enter a valid phone number" },
      ],
      ui: {
        description: "Only if different from the phone number above.",
      },
    },
  ],
};
