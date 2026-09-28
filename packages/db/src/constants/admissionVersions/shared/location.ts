import * as v from "valibot";

import { LocationSourceSchema } from "./enums";

/**
 * One entry in the applicant's *user-chosen* location history — every point
 * they explicitly confirmed (GPS-confirmed, map-click-confirmed, or typed
 * manually), oldest first. The form's single `latitudeField`/`longitudeField`
 * always mirrors the LAST entry here; this array exists purely as an
 * append-only audit trail so a reviewer can see every location the
 * applicant actually committed to, not just the final one — catching a
 * pattern like "picked home, then quietly nudged it next to the school
 * right before submitting".
 */
export const LocationHistoryEntrySchema = v.object({
  lat: v.number(),
  lng: v.number(),
  source: LocationSourceSchema,
  /** ISO 8601 timestamp of when the applicant confirmed this point. */
  capturedAt: v.string(),
  address: v.optional(v.nullable(v.string())),
});

export type LocationHistoryEntry = v.InferOutput<typeof LocationHistoryEntrySchema>;

/**
 * One entry in the *background* GPS audit trail — a raw device geolocation
 * reading taken silently (no UI, no user action) once per page load of the
 * location step, independent of whatever the applicant has chosen or typed.
 * Never written into `latitudeField`/`longitudeField` and never shown as the
 * applicant's selection; it exists solely so a reviewer can cross-check the
 * device's actual position against the location the applicant committed to.
 */
export const GpsAuditEntrySchema = v.object({
  /** Null when the capture attempt failed (see `status`) \u2014 no fix obtained. */
  lat: v.optional(v.nullable(v.number())),
  lng: v.optional(v.nullable(v.number())),
  accuracy: v.optional(v.nullable(v.number())),
  /** ISO 8601 timestamp of the background capture attempt. */
  capturedAt: v.string(),
  /** Whether the browser actually returned a fix, and if not, why. */
  status: v.picklist(["granted", "denied", "unavailable", "timeout", "unsupported"]),
});
export type GpsAuditEntry = v.InferOutput<typeof GpsAuditEntrySchema>;
