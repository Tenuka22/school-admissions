# Admission Versions

Immutable, schema-driven versioning system for the G1 admission application form.

Each version covers a specific intake year. Within a version, subversions track incremental changes (fields added, removed, patched, renamed). Older subversions are **never modified** — new changes always go into a new subversion.

> v1 currently has a **single complete subversion (v1.1)** — 100% of the source `aloysius-g1` application form: all steps, every field, the location-map capture and the cascading district → division selects. The versioning **system** (deltas, migrations, registry) stays active; the next change ships as v1.2 on top of it.

## Folder Structure

```text
admissionVersions/
├── shared/
│   ├── enums.ts          # Valibot enum schemas (Gender, Religion, Relationship, …)
│   ├── divisions.ts      # District + DS division picklists & cascade mapping
│   └── types.ts          # Field/step types, dependency resolution, delta types
├── versions/
│   └── v1/
│       ├── index.ts      # Version registry — assembles subversions
│       └── v1.1/
│           ├── schema.ts # Valibot schema — complete form shape
│           ├── fields.ts # Field definitions, step-grouped, with dependencies
│           └── index.ts  # Exports SubversionModule
├── builder.ts            # Resolver & migration utilities
└── index.ts              # Public API re-exports
```

## Form steps

Fields carry a `step` (matching the g1 application page) and an optional `group` sub-divider:

`location` → `applicant` → `guardian` → `residence` → `categories` → `declaration` → `review`

- **location** — map capture (`locationLatitude`/`Longitude`); the marking system reads the same circle to count nearby schools
- **applicant** — names, gender, religion, education medium, DOB, birth-certificate number
- **guardian** — relationship, names, NIC (validated), phone, optional email
- **residence** — bilingual addresses, `sameAsPermanent` (clears current-address fields on change), cascading `district` → `division` (`restrictsOptions`), GN division, electoral district
- **declaration** — two required literal-true booleans

The **categories** step is owned by the marking system (`../markingVersions`), and **review** renders everything.

## Dependency system

- `visibleWhen` — field only shown/enabled when conditions hold (e.g. current address when `sameAsPermanent` is false)
- `gates` — a field cannot be entered until its controller matches
- `clearsOnChange` — changing a parent clears dependents recursively
- `restrictsOptions` — cascading selects (district filters division options)
- `enumSchema` — select backed by a shared valibot picklist

Helpers: `resolveFieldStates`, `resolveFieldOptions`, `clearFieldAndDependents`, `groupFields`.

## Adding a new subversion

1. Create `versions/v1/v1.N/` with `schema.ts` (spread previous entries), `delta.ts` (added/removed/patched/renamed), `fields.ts` (previous fields + delta) and `index.ts`.
2. Register it in `versions/v1/index.ts`.

### What NOT to do

- **Never edit an existing subversion's files** once it's shipped
- **Never reorder or skip subversion numbers** — gaps break migration walks
- **Never add fields directly to `fields.ts`** without a corresponding `delta.ts`
- **Never mutate the `schema` object** — always spread previous entries

## Public API

| Export | Description |
| --- | --- |
| `ADMISSION_VERSIONS` | Registry of all versions keyed by version string |
| `ADMISSION_STEPS` | Ordered form-step keys |
| `getLatestSubversionNumber(versionKey)` | Highest subversion number for a version |
| `getSubversionModule(versionKey, subversionNumber?)` | SubversionModule (or latest if omitted) |
| `getFieldsForSubversion(versionKey, subversionNumber)` | Resolved field definitions |
| `getFieldsChangedBetweenSubversions(versionKey, from, to)` | New + newly-required fields |
| `calculateMigrationRequirements(versionKey, from, to)` | Walks deltas — newFields, newlyRequired, removedFieldKeys |
| `resolveFieldStates / resolveFieldOptions / clearFieldAndDependents / groupFields` | Dependency resolution helpers |

## Types

| Type | Source |
| --- | --- |
| `AdmissionVersion` | Top-level version (key, intakeYear, subversions) |
| `SubversionModule<TSchema>` | A single subversion (schema, fields, delta) |
| `AdmissionFieldDefinition` | A field (key, label, type, required, options, step, group, dependencies, mapConfig, enumSchema) |
| `AdmissionStepKey` | Union of form-step keys |
| `AdmissionMapFieldConfig` | Map proximity deduction (maxMarks, pointsPerSchool) \u2014 radius is auto-derived from home-to-school distance, not configured |
| `SubversionDelta` | Migration delta (added, removed, patched, renamed) |
| `FieldType` | Union of valid field types (text, number, date, select, boolean, file, map, list) |
