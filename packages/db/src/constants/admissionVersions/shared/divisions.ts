import * as v from "valibot";

/**
 * Administrative divisions (Sri Lanka — Southern Province) used by the
 * cascading address selects. Mirrors the id data of the source
 * `aloysius-g1` project's `apps/web/src/lib/g1/divisions.ts` (ids only —
 * bilingual display labels stay in the UI layer).
 */

export const DistrictSchema = v.picklist(["galle", "matara", "hambantota"]);
export type District = v.InferOutput<typeof DistrictSchema>;

export const DivisionSchema = v.picklist([
  // ── Galle ──────────────────────────────────────────────────────────────
  "galle-fg",
  "akmeemana",
  "ambalangoda",
  "baddegama",
  "balapitiya",
  "benthota",
  "bope-poddala",
  "elpitiya",
  "gonapinuwala",
  "habaraduwa",
  "hikkaduwa",
  "imaduwa",
  "karandeniya",
  "madampagama",
  "nagoda",
  "neluwa",
  "niyagama",
  "rathgama",
  "thawalama",
  "waduramba",
  "welivitiya",
  "yakkalamulla",
  // ── Matara ─────────────────────────────────────────────────────────────
  "akuressa",
  "athuraliya",
  "devinuwara",
  "dickwella",
  "hakmana",
  "kamburupitiya",
  "kirinda",
  "kotapola",
  "malimbada",
  "matara-ds",
  "mulatiyana",
  "pasgoda",
  "pitabeddara",
  "thihagoda",
  "weligama",
  "welipitiya",
  // ── Hambantota ─────────────────────────────────────────────────────────
  "ambalantota",
  "angunakolapelessa",
  "beliatta",
  "hambantota-ds",
  "katuwana",
  "lunugamvehera",
  "okewela",
  "sooriyawewa",
  "tangalle",
  "thissamaharama",
  "weeraketiya",
  "walasmulla",
]);
export type Division = v.InferOutput<typeof DivisionSchema>;

/** Divisions belonging to each district — the cascading-select mapping. */
export const DIVISIONS_BY_DISTRICT: Record<District, Division[]> = {
  galle: [
    "galle-fg",
    "akmeemana",
    "ambalangoda",
    "baddegama",
    "balapitiya",
    "benthota",
    "bope-poddala",
    "elpitiya",
    "gonapinuwala",
    "habaraduwa",
    "hikkaduwa",
    "imaduwa",
    "karandeniya",
    "madampagama",
    "nagoda",
    "neluwa",
    "niyagama",
    "rathgama",
    "thawalama",
    "waduramba",
    "welivitiya",
    "yakkalamulla",
  ],
  matara: [
    "akuressa",
    "athuraliya",
    "devinuwara",
    "dickwella",
    "hakmana",
    "kamburupitiya",
    "kirinda",
    "kotapola",
    "malimbada",
    "matara-ds",
    "mulatiyana",
    "pasgoda",
    "pitabeddara",
    "thihagoda",
    "weligama",
    "welipitiya",
  ],
  hambantota: [
    "ambalantota",
    "angunakolapelessa",
    "beliatta",
    "hambantota-ds",
    "katuwana",
    "lunugamvehera",
    "okewela",
    "sooriyawewa",
    "tangalle",
    "thissamaharama",
    "weeraketiya",
    "walasmulla",
  ],
};
