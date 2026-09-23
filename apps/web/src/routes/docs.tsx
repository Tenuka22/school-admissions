import {
  ADMISSION_VERSIONS,
  getFieldsForSubversion,
  getLatestSubversionNumber,
} from "@school-admissions/db/constants/admissionVersions/index";
import type { AdmissionFieldDefinition } from "@school-admissions/db/constants/admissionVersions/index";
import {
  getCategoriesForSubversion,
  getLatestMarkingSubversionNumber,
  groupFields as groupMarkingFields,
  MARKING_VERSIONS,
} from "@school-admissions/db/constants/markingVersions/index";
import type { MarkingCategoryDefinition } from "@school-admissions/db/constants/markingVersions/index";
import {
  ABROAD_PERIOD_TIERS,
  AL_MAX_MARKS,
  CARNIVAL_CONTRIBUTION,
  CONTRIBUTION_PATH1_ELSEWHERE_MAX,
  CONTRIBUTION_PATH1_ELSEWHERE_RATE,
  CONTRIBUTION_PATH1_SAME_SCHOOL_MAX,
  CONTRIBUTION_PATH1_SAME_SCHOOL_RATE,
  CONTRIBUTION_PATH1_YEARS_CAP,
  CONTRIBUTION_PATH2_ITEM_MAX,
  CONTRIBUTION_PATH2_RATE_PER_ITEM,
  DEED_AGE_WEIGHTS,
  DEGREE_MARKS,
  DIFFICULT_DISTANCE_RATE_TIERS,
  DIFFICULT_SERVICE_CURRENT_RATE,
  DIFFICULT_SERVICE_MAX,
  DIFFICULT_SERVICE_PREVIOUS_RATE,
  DIFFICULT_SERVICE_YEARS_CAP,
  DIPLOMA_MARKS,
  ELECTORAL_MARKS_PER_PERSON_YEAR_61,
  ELECTORAL_MARKS_PER_PERSON_YEAR_63,
  ELECTORAL_MAX_61,
  ELECTORAL_MAX_63,
  EMPLOYMENT_PURPOSE_MARKS,
  GRADE5_SCHOLARSHIP_MARKS,
  LEADERSHIP_ROLE_MARKS,
  MAIN_DOCUMENT_MARKS_61,
  MAIN_DOCUMENT_MARKS_63,
  OL_MAX_MARKS,
  OTHER_ACTIVITY_MARKS,
  PAST_PUPILS_COMMITTEE_MARKS_PER_YEAR,
  PAST_PUPILS_EXECUTIVE_COUNT,
  PAST_PUPILS_EXECUTIVE_MARKS,
  PAST_PUPILS_LIFE_MEMBER_MARKS_PER_YEAR,
  PAST_PUPILS_LIFE_MEMBER_MAX,
  PAST_PUPILS_TOTAL_MAX,
  PAST_PUPILS_YEARLY_MARKS,
  RESIDENCE_DISTANCE_TIERS_64,
  SCHOOL_PROJECTS_MARKS,
  SCHOOLS_RADIUS_KM,
  SHRAMADANA_CONTRIBUTION,
  SIBLING_EXAM_MARKS,
  SIBLING_GRADES_MAX,
  SIBLING_LEADERSHIP_MARKS,
  SIBLING_MARKS_PER_GRADE,
  SIBLING_MULTIPLE_STUDYING_MARKS,
  SIBLING_SPORTS_LEVEL_MARKS,
  SIBLING_STUDIED_HERE_MARKS,
  SIBLING_SUPPORT_MARKS,
  SPORTS_LEVEL_MARKS,
  TRANSFER_DISTANCE_TIERS,
  TRANSFER_ELAPSED_TIERS,
  TRANSFER_PREVIOUS_PERIOD_TIERS,
  UNUTILIZED_LEAVE_MARKS_PER_YEAR,
  UNUTILIZED_LEAVE_MAX,
  WORKPLACE_DISTANCE_TIERS,
  YEARS_EDUCATED_MARKS_PER_YEAR,
  YEARS_EDUCATED_MAX,
} from "@school-admissions/db/constants/markingVersions/shared/marking-scheme";
import { Badge } from "@school-admissions/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@school-admissions/ui/components/card";
import { Separator } from "@school-admissions/ui/components/separator";
import {
  IconClipboardList,
  IconLayoutSidebar,
  IconMapPin,
  IconRuler2,
  IconStack2,
  IconUsersGroup,
} from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "cn";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { MarkTable, ProximityScale, RateTierTable, StatChip, TierTable } from "@/components/docs/mark-tables";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

const ADMISSION_STEP_LABELS: Record<string, string> = {
  location: "Location",
  applicant: "Applicant (Child)",
  guardian: "Parent / Guardian",
  residence: "Residence",
  categories: "Categories",
  declaration: "Declaration",
  review: "Review",
};

const CATEGORY_ICONS: Record<string, typeof IconMapPin> = {
  "6.1": IconMapPin,
  "6.2": IconStack2,
  "6.3": IconUsersGroup,
  "6.4": IconClipboardList,
  "6.5": IconRuler2,
  "6.6": IconRuler2,
};

/**
 * Clarifying labels for residence-document option keys that are otherwise
 * ambiguous once humanized ("Title deed applicant" doesn't say whose name
 * the deed/electoral record needs to be in). Falls back to the shared
 * humanize() in mark-tables.tsx for any key not listed here.
 */
const DOCUMENT_LABEL_OVERRIDES: Record<string, string> = {
  "title-deed-applicant": "Title deed (in applicant's / spouse's name)",
  "title-deed-applicant-spouse": "Title deed (in applicant's / spouse's name)",
  "title-deed-parents": "Title deed (in child's parents' name)",
  "feeder-electoral-5yrs": "Electoral register — feeder area, last 5 years",
  "lease-deed": "Lease deed",
  "municipal-ds-certificate": "Municipal / DS certificate",
  "municipal-ds-rentact-cert": "Municipal / DS / Rent Act certificate",
  "other-documents": "Other supporting documents",
};

const GUARDIAN_RELATIONSHIP_HINT =
  "\"Guardian\" covers a legal guardian other than a parent \u2014 e.g. a grandparent raising the child \u2014 and must be supported by a court order or Grama Niladhari certificate of guardianship.";

/** Highlights the sidebar link for whichever section is nearest the top of the viewport. */
function useActiveSection(ids: string[]): string | undefined {
  const [activeId, setActiveId] = useState<string | undefined>(ids[0]);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

function DocsPage() {
  const admissionVersion = ADMISSION_VERSIONS.v1;
  const admissionSubversion = getLatestSubversionNumber("v1");
  const admissionFields = getFieldsForSubversion("v1", admissionSubversion) ?? [];

  const markingVersion = MARKING_VERSIONS.v1;
  const markingSubversion = getLatestMarkingSubversionNumber("v1");
  const categories = getCategoriesForSubversion("v1", markingSubversion) ?? [];

  const fieldsByStep: Record<string, AdmissionFieldDefinition[]> = {};
  for (const field of admissionFields) {
    (fieldsByStep[field.step] ??= []).push(field);
  }
  const stepEntries = Object.entries(fieldsByStep);

  const sections = [
    { id: "form", label: "Application form" },
    ...categories.map((c) => ({ id: `cat-${c.type}`, label: `${c.type} ${c.label}` })),
  ];
  const activeId = useActiveSection(sections.map((s) => s.id));

  return (
    <>
      <div className="border-b bg-gradient-to-b from-primary/[0.03] to-transparent">
        <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-12 sm:px-6">
          <Badge variant="outline" className="w-fit font-mono">
            {admissionVersion.key} · intake {admissionVersion.intakeYear}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Documentation</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            How the {admissionVersion.intakeYear} Grade 1 application form is structured, and
            exactly how each of the six marking-scheme categories (6.1–6.6) allocates marks —
            generated straight from the live version definitions in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-[0.8em]">
              packages/db/src/constants
            </code>
            , so this page can never drift from what the app actually scores.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl items-start gap-10 px-4 py-10 sm:px-6">
        {/* ── Sidebar (desktop) ─────────────────────────────────────── */}
        <aside className="sticky top-20 hidden w-56 shrink-0 self-start lg:block">
          <p className="mb-3 flex items-center gap-1.5 px-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <IconLayoutSidebar className="size-3.5" />
            On this page
          </p>
          <nav className="grid gap-0.5 border-l">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "-ml-px border-l px-3 py-1.5 text-xs transition-colors",
                  activeId === s.id
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                )}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {/* ── Mobile section nav ───────────────────────────────────── */}
          <nav aria-label="Sections" className="mb-8 flex flex-wrap gap-2 lg:hidden">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className={docsNavLinkClass}>
                {s.label}
              </a>
            ))}
          </nav>

          {/* ── Application form ─────────────────────────────────────── */}
          <section id="form" className="grid scroll-mt-20 gap-6">
            <div className="grid gap-1.5 border-b pb-4">
              <h2 className="text-2xl font-semibold tracking-tight">Application form</h2>
              <p className="text-sm text-muted-foreground">
                {admissionFields.length} fields across {stepEntries.length} steps · subversion{" "}
                {admissionVersion.key}.{admissionSubversion}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {stepEntries.map(([step, fields]) => (
                <Card key={step}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {ADMISSION_STEP_LABELS[step] ?? step}
                      <Badge variant="secondary">{fields.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Step key: {step}
                      {step === "guardian" && " — the child's parent or legal guardian"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid gap-1.5">
                      {fields.map((field) => (
                        <li
                          key={field.key}
                          className="flex items-center justify-between gap-2 border-b border-dashed py-1 text-xs last:border-b-0"
                        >
                          <span className="flex items-center gap-1.5 text-foreground">
                            {field.label}
                            {field.required && <span className="text-destructive">*</span>}
                          </span>
                          <Badge variant="outline" className="font-mono text-[0.625rem]">
                            {field.type}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                    {step === "guardian" && (
                      <p className="mt-3 border-t pt-3 text-[0.6875rem] text-muted-foreground">
                        {GUARDIAN_RELATIONSHIP_HINT}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator className="my-12" />

          {/* ── Marking scheme ───────────────────────────────────────── */}
          <div className="grid gap-1.5 border-b pb-4">
            <h2 className="text-2xl font-semibold tracking-tight">Marking scheme</h2>
            <p className="text-sm text-muted-foreground">
              {markingVersion.description} · subversion {markingVersion.key}.{markingSubversion} ·
              each category is capped at 100 marks. Map-proximity fields count schools within{" "}
              {SCHOOLS_RADIUS_KM} km of the applicant's pinned location.
            </p>
          </div>

          <div className="mt-6 grid gap-6">
            {categories.map((category) => (
              <CategorySection key={category.type} category={category} />
            ))}
          </div>

          <div className="mt-16 flex justify-center border-t pt-8">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}

const docsNavLinkClass =
  "inline-flex h-7 items-center rounded-full border bg-muted/40 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

function CategorySection({ category }: { category: MarkingCategoryDefinition }) {
  const Icon = CATEGORY_ICONS[category.type] ?? IconClipboardList;
  const groups = groupMarkingFields(category.fields);
  const mapField = category.fields.find((f) => f.type === "map");

  return (
    <Card id={`cat-${category.type}`} className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          <span className="font-mono text-muted-foreground">{category.type}</span>
          {category.label}
          <Badge className="ml-auto">{category.maxMarks} marks max</Badge>
          {category.allowMultipleEntries && (
            <Badge variant="outline">multiple entries allowed</Badge>
          )}
        </CardTitle>
        <CardDescription>{category.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Form fields
          </h3>
          {groups.map((g) => (
            <div key={g.group ?? "ungrouped"} className="grid gap-1.5">
              {g.group && <p className="text-xs font-medium text-foreground">{g.group}</p>}
              <ul className="grid gap-1">
                {g.fields.map((field) => (
                  <li
                    key={field.key}
                    className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2.5 py-1.5 text-xs"
                  >
                    <span className="text-foreground">{field.label}</span>
                    <Badge variant="outline" className="font-mono text-[0.625rem]">
                      {field.type}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {mapField?.mapConfig && (
            <ProximityScale
              maxMarks={mapField.mapConfig.maxMarks}
              perSchool={mapField.mapConfig.pointsPerSchool}
            />
          )}
        </div>

        <div className="grid gap-4">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            How marks are allocated
          </h3>
          <ScoringBreakdown type={category.type} />
        </div>
      </CardContent>
    </Card>
  );
}

function ScoringBreakdown({ type }: { type: string }): ReactNode {
  switch (type) {
    case "6.1":
      return (
        <div className="grid gap-3">
          <MarkTable
            title="Main residence document"
            records={MAIN_DOCUMENT_MARKS_61}
            labelOverrides={DOCUMENT_LABEL_OVERRIDES}
          />
          <TierTable
            title="Title/lease deed age weighting"
            tiers={DEED_AGE_WEIGHTS.map((w) => [w.minYears, w.weight] as [number, number])}
            columns={["Deed age (years)", "Weight ×"]}
          />
          <StatChip label="Additional supporting documents" value="1 mark each, up to 5" />
          <StatChip
            label="Electoral register"
            value={`${ELECTORAL_MARKS_PER_PERSON_YEAR_61} / person-year`}
            unit={`cap ${ELECTORAL_MAX_61}`}
          />
        </div>
      );
    case "6.2":
      return (
        <div className="grid gap-3">
          <StatChip
            label="Years educated at this school"
            value={`${YEARS_EDUCATED_MARKS_PER_YEAR} / year`}
            unit={`cap ${YEARS_EDUCATED_MAX}`}
          />
          <StatChip label="Grade 5 scholarship passed" value={GRADE5_SCHOLARSHIP_MARKS} />
          <StatChip label="O/L grade-rate scoring" value={`cap ${OL_MAX_MARKS}`} />
          <StatChip label="A/L grade-rate scoring" value={`cap ${AL_MAX_MARKS}`} />
          <MarkTable title="Sports achievement level" records={SPORTS_LEVEL_MARKS} />
          <MarkTable title="Leadership roles" records={LEADERSHIP_ROLE_MARKS} />
          <MarkTable title="Other co-curricular activities" records={OTHER_ACTIVITY_MARKS} />
          <StatChip
            label="Past Pupils' — life member"
            value={`${PAST_PUPILS_LIFE_MEMBER_MARKS_PER_YEAR} / year`}
            unit={`cap ${PAST_PUPILS_LIFE_MEMBER_MAX}`}
          />
          <StatChip
            label="Past Pupils' — ordinary member"
            value={`${PAST_PUPILS_YEARLY_MARKS} / year`}
          />
          <StatChip
            label="Past Pupils' — committee year"
            value={`${PAST_PUPILS_COMMITTEE_MARKS_PER_YEAR} / year`}
          />
          <StatChip
            label="Past Pupils' — executive post"
            value={PAST_PUPILS_EXECUTIVE_MARKS}
            unit={`up to ${PAST_PUPILS_EXECUTIVE_COUNT}, total cap ${PAST_PUPILS_TOTAL_MAX}`}
          />
          <MarkTable title="Highest degree" records={DEGREE_MARKS} />
          <StatChip label="Diploma / higher diploma" value={DIPLOMA_MARKS} />
          <StatChip label="Carnival contribution" value={`${CARNIVAL_CONTRIBUTION} each`} />
          <StatChip label="Shramadana contribution" value={`${SHRAMADANA_CONTRIBUTION} each`} />
          <StatChip label="School project contribution" value={SCHOOL_PROJECTS_MARKS} />
          <p className="text-[0.6875rem] text-muted-foreground">
            O/L (6/8/9/10 subjects) and A/L (3/4 subjects) grades are scored on a per-subject-count
            ceiling table — S/C/B/A grades each weighted, then capped per exam.
          </p>
        </div>
      );
    case "6.3":
      return (
        <div className="grid gap-3">
          <StatChip
            label="Grades completed by sibling"
            value={`${SIBLING_MARKS_PER_GRADE} / grade`}
            unit={`cap ${SIBLING_GRADES_MAX}`}
          />
          <StatChip label="Sibling studied at applied school" value={SIBLING_STUDIED_HERE_MARKS} />
          <StatChip
            label="2+ siblings studying other grades"
            value={SIBLING_MULTIPLE_STUDYING_MARKS}
          />
          <MarkTable title="Sibling sports achievement level" records={SIBLING_SPORTS_LEVEL_MARKS} />
          <MarkTable title="Sibling exam achievements" records={SIBLING_EXAM_MARKS} />
          <StatChip label="Sibling leadership (prefect / scout)" value={SIBLING_LEADERSHIP_MARKS} />
          <StatChip label="Parent cooperation shown" value={SIBLING_SUPPORT_MARKS} />
          <MarkTable
            title="Residence document"
            records={MAIN_DOCUMENT_MARKS_63}
            labelOverrides={DOCUMENT_LABEL_OVERRIDES}
          />
          <StatChip
            label="Electoral register"
            value={`${ELECTORAL_MARKS_PER_PERSON_YEAR_63} / person-year`}
            unit={`cap ${ELECTORAL_MAX_63}`}
          />
        </div>
      );
    case "6.4":
      return (
        <div className="grid gap-3">
          <StatChip
            label="Contribution — same school (Path I)"
            value={`${CONTRIBUTION_PATH1_SAME_SCHOOL_RATE} / year`}
            unit={`cap ${CONTRIBUTION_PATH1_SAME_SCHOOL_MAX}, ${CONTRIBUTION_PATH1_YEARS_CAP}y max`}
          />
          <StatChip
            label="Contribution — elsewhere (Path I)"
            value={`${CONTRIBUTION_PATH1_ELSEWHERE_RATE} / year`}
            unit={`cap ${CONTRIBUTION_PATH1_ELSEWHERE_MAX}`}
          />
          <StatChip
            label="Contribution — exam/curriculum/training (Path II)"
            value={`${CONTRIBUTION_PATH2_RATE_PER_ITEM} / item`}
            unit={`cap ${CONTRIBUTION_PATH2_ITEM_MAX}`}
          />
          <StatChip
            label="Difficult service — current"
            value={`${DIFFICULT_SERVICE_CURRENT_RATE} / year`}
            unit={`cap ${DIFFICULT_SERVICE_MAX}, ${DIFFICULT_SERVICE_YEARS_CAP}y max`}
          />
          <StatChip
            label="Difficult service — previous"
            value={`${DIFFICULT_SERVICE_PREVIOUS_RATE} / year`}
          />
          <RateTierTable
            title="Difficult-service distance rate tiers"
            tiers={DIFFICULT_DISTANCE_RATE_TIERS}
            columns={["Min km", "Rate / year", "Tier cap"]}
          />
          <TierTable
            title="Residence-to-school distance"
            tiers={RESIDENCE_DISTANCE_TIERS_64}
            columns={["Max km", "Marks"]}
          />
          <TierTable
            title="Workplace-to-school distance"
            tiers={WORKPLACE_DISTANCE_TIERS}
            columns={["Min km", "Marks"]}
          />
          <StatChip
            label="Unutilized leave"
            value={`${UNUTILIZED_LEAVE_MARKS_PER_YEAR} / year`}
            unit={`cap ${UNUTILIZED_LEAVE_MAX}`}
          />
        </div>
      );
    case "6.5":
      return (
        <div className="grid gap-3">
          <TierTable
            title="Transfer distance"
            tiers={TRANSFER_DISTANCE_TIERS}
            columns={["Min km", "Marks"]}
          />
          <TierTable
            title="Previous-station service period"
            tiers={TRANSFER_PREVIOUS_PERIOD_TIERS}
            columns={["Min years", "Marks"]}
          />
          <TierTable
            title="Time elapsed since transfer"
            tiers={TRANSFER_ELAPSED_TIERS}
            columns={["Max years", "Marks"]}
          />
        </div>
      );
    case "6.6":
      return (
        <div className="grid gap-3">
          <TierTable
            title="Period spent abroad"
            tiers={ABROAD_PERIOD_TIERS}
            columns={["Min years", "Marks"]}
          />
          <MarkTable title="Purpose of foreign stay" records={EMPLOYMENT_PURPOSE_MARKS} />
        </div>
      );
    default:
      return null;
  }
}
