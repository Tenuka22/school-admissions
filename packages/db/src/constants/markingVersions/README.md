# Marking Versions

Immutable, schema-driven versioning system for the G1 **marking scheme**. Mirrors `../admissionVersions/` — each version covers an intake year and subversions track incremental changes — but the unit of change is a **category**, not a form field.

## Structure

```text
markingVersions/
├── shared/
│   ├── types.ts            # MarkingCategoryDefinition, entries, delta types,
│   │                       # field-state resolution, step keys
│   ├── marking-scheme.ts   # 100% of the g1 scoring constants (single source of truth)
│   ├── scoring.ts          # 100% of the g1 scoring formulas + map deduction
│   ├── entry-schema.ts     # Valibot entry schemas + entry validation
│   └── intake-year.ts      # Default intake year
├── versions/
│   └── v1/
│       ├── index.ts        # Version registry — assembles subversions
│       └── v1.1/           # The COMPLETE G1 2027 scheme (single subversion)
│           ├── categories.ts   # All 6 categories, all fields, step grouping
│           ├── delta.ts        # Empty delta (initial subversion)
│           └── index.ts
├── builder.ts              # Resolver & migration utilities
└── index.ts                # Public API re-exports
```

## v1.1 — the complete G1 2027 scheme

A single subversion carries **100%** of the source `aloysius-g1` circular:

| Type  | Category                           | Step       |
| ----- | ---------------------------------- | ---------- |
| `6.1` | Residence Verification & Proximity | categories |
| `6.2` | Alumni                             | categories |
| `6.3` | Siblings                           | categories |
| `6.4` | Education Sector / Teaching Staff  | categories |
| `6.5` | Transfer Applications              | categories |
| `6.6` | Foreign Employment                 | categories |

Every category caps at 100 marks, every scored field from the g1 `marking-scheme.ts` / `scoring.ts` is present (constants live in `shared/marking-scheme.ts` — tiers, rates, caps, deed-age weights, O/L & A/L ceilings, electoral-register windows), and every category lists its scored fields with g1's dependency behaviour (`visibleWhen`, `clearsOnChange`).

## Map proximity deduction

Categories 6.1, 6.3, 6.5 and 6.6 carry a `map` field (`schoolsWithinRadius`) with a `mapConfig`:

```ts
mapConfig: { maxMarks: 50, pointsPerSchool: 5, pointsKm: 10 }
```

The applicant pins their home on the map; the system counts government schools inside the `pointsKm` circle. Proximity is a scarcity criterion: the category starts at `maxMarks` and **deducts** `pointsPerSchool` marks per nearby school, floored at 0.

| Category | Max | Per school |
| -------- | --- | ---------- |
| 6.1      | 50  | 5          |
| 6.3      | 30  | 3          |
| 6.5      | 30  | 3          |
| 6.6      | 35  | 3.5        |

## Entries

Applications hold `MarkingCategoryEntry[]` — `{ id, type, inputs }` — so any category type can be added multiple times (ids must be unique), matching g1's `application-store` behaviour.

## Rules

Same as the admission versions:

- Never edit a shipped subversion — add a new one
- Never reorder or skip subversion numbers
- `v1.1` has an empty delta; every later subversion declares one
- Later subversions list their complete `categories` and describe the change in `delta` (`added` / `removed` / `patched` / `renamed`)

## Public API

| Export | Description |
| --- | --- |
| `MARKING_VERSIONS` | Registry of marking versions |
| `getLatestMarkingSubversionNumber(key)` | Highest subversion number |
| `getMarkingSubversionModule(key, sub?)` | A subversion module (latest if omitted) |
| `getCategoriesForSubversion(key, sub)` | Complete category list |
| `calculateMarkingMigrationRequirements(key, from, to)` | Added/removed/patched categories |
| `validateCategoryEntries(categories, entries)` | Entry type / multiplicity checks |
| `buildEntrySchema(category)` | Valibot schema for one entry's `inputs` |
| `scoreCategory(entry)` | Full breakdown for one category entry |
| `scoreApplication(entries)` | Totals + per-entry breakdowns |
| `scoreCategory61…66(inputs)` | Per-category formula ports |
| `resolveFieldStates(fields, data)` | `visibleWhen` / gate resolution |
| `resolveFieldOptions(fields, data)` | Cascading-select option filtering |
| `clearFieldAndDependents(fields, key, data)` | Recursive clearing on change |
| `groupFields(fields)` | Group fields by their `group` sub-divider |
| `MARKING_STEPS` | g1 form step keys (`location` … `review`) |
| `CATEGORY_MAX_MARKS`, `electoralRegisterYears()` | Shared scheme constants |
