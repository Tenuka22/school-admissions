import { Badge } from "@school-admissions/ui/components/badge";
import { Button } from "@school-admissions/ui/components/button";
import type { SchoolCatalogEntry } from "@school-admissions/db/constants/schools/index";
import { compatibleSchoolsWithinRadius } from "@school-admissions/db/constants/schools/index";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@school-admissions/ui/components/empty";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@school-admissions/ui/components/tooltip";
import { ClientOnly } from "@tanstack/react-router";
import { cn } from "cn";
import { IconCheck, IconInfoCircle, IconMapPin, IconSchool, IconTrash } from "@tabler/icons-react";
import { lazy, Suspense } from "react";

import { HOME_SCHOOL_ID } from "@/lib/g1/school-config";

const NearbySchoolMapLazy = lazy(() =>
  import("@/components/g1/application/nearby-school-map").then((m) => ({ default: m.NearbySchoolMap }))
);

export interface NearbySchoolPoint {
  lat: number;
  lng: number;
  /** Set when this entry is a real catalog school (see `compatibleSchoolsWithinRadius`) rather than a manually dropped pin. */
  schoolId?: string;
  /** The catalog school's display name, carried along so the entry list doesn't need a catalog lookup to render. */
  name?: string;
}

export interface NearbySchoolsFieldProps {
  value: unknown;
  onChange: (value: NearbySchoolPoint[]) => void;
  disabled?: boolean;
  /** The applicant's own home location, captured in the Location step \u2014 the proximity circle's center. */
  homePoint: [number, number] | null;
  maxMarks: number;
  pointsPerSchool: number;
  /** Jumps back to the Location step when no home point has been set yet. */
  onNavigateToLocation?: () => void;
}

function isNearbySchoolPoint(value: unknown): value is NearbySchoolPoint {
  return (
    typeof value === "object" &&
    value !== null &&
    "lat" in value &&
    "lng" in value &&
    typeof (value as { lat: unknown }).lat === "number" &&
    typeof (value as { lng: unknown }).lng === "number"
  );
}

/**
 * Emerald -> amber -> rose scan color keyed to how far a school sits inside
 * the proximity radius (0 = right on top of home, 1 = at the radius edge).
 * Purely a distance-scanning aid for the list \u2014 the marking scheme deducts
 * the same flat `pointsPerSchool` no matter the distance, so this never
 * implies "far is worse", only "further to look at on the map".
 */
function distanceColor(ratio: number): string {
  const clamped = Math.min(1, Math.max(0, ratio));
  const stops: Array<[number, [number, number, number]]> = [
    [0, [16, 185, 129]], // emerald-500
    [0.5, [245, 158, 11]], // amber-500
    [1, [244, 63, 94]], // rose-500
  ];
  let lo = stops[0];
  let hi = stops[1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (clamped >= stops[i][0] && clamped <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const t = (clamped - lo[0]) / span;
  const [r, g, b] = lo[1].map((channel, index) => Math.round(channel + (hi[1][index] - channel) * t));
  return `rgb(${r} ${g} ${b})`;
}

/**
 * Rich per-school detail shown on hover \u2014 the compact list row only has
 * room for name + distance, but the catalog carries Ministry/Maps detail
 * (category, grades, medium, contact) worth surfacing without a click.
 */
function SchoolInfoTooltipContent({ school }: { school: SchoolCatalogEntry }) {
  const facts = [school.schoolCategory, school.gradeSpan, school.medium, school.governmentType].filter(
    (fact): fact is string => Boolean(fact)
  );
  return (
    <div className="grid gap-1.5">
      <p className="font-semibold">{school.name}</p>
      {school.address && <p className="text-muted-foreground">{school.address}</p>}
      {facts.length > 0 && <p className="text-muted-foreground">{facts.join(" \u00b7 ")}</p>}
      {school.totalStudents != null && (
        <p className="text-muted-foreground">{school.totalStudents.toLocaleString()} students</p>
      )}
      {(school.phone || school.website) && (
        <p className="flex flex-wrap gap-x-3 text-primary">
          {school.phone && (
            <a href={`tel:${school.phone.replace(/\s+/g, "")}`} className="underline underline-offset-2">
              {school.phone}
            </a>
          )}
          {school.website && (
            <a href={school.website} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              Website
            </a>
          )}
        </p>
      )}
    </div>
  );
}

/**
 * The marking scheme's proximity criterion only ever needs a *count* of
 * nearby government schools (`scoring.ts` reads `.length`), but counting
 * them against a disconnected free-text list is meaningless \u2014 an applicant
 * could type any number. This links the count to the applicant's real home
 * location and, where the government schools catalog has coverage, to real
 * schools: every catalog school within the radius is ranked by distance in
 * the side list, color-coded near-to-far, and clicking a row (or its marker
 * on the map) toggles it in or out. Areas the catalog hasn't scraped yet
 * fall back to a manually dropped pin (clicking empty map), same as before.
 */
export function NearbySchoolsField({
  value,
  onChange,
  disabled,
  homePoint,
  maxMarks,
  pointsPerSchool,
  onNavigateToLocation,
}: NearbySchoolsFieldProps) {
  const schools = Array.isArray(value) ? value.filter(isNearbySchoolPoint) : [];
  // The radius is never a fixed config number: it's the applicant's actual
  // distance from home to the school they're applying to, so it can't be
  // gamed by tuning a per-category constant. Only gender-compatible schools
  // (see `isGenderCompatible`) count as competing alternatives.
  const proximity = homePoint ? compatibleSchoolsWithinRadius(homePoint, HOME_SCHOOL_ID) : null;
  const catalogNearby = proximity?.schools ?? [];
  const radiusKm = proximity?.radiusKm ?? 0;
  const targetSchoolName = proximity?.target?.name ?? "the applied school";
  const selectedCatalogIds = new Set(schools.filter((s) => s.schoolId).map((s) => s.schoolId));
  const manualPins = schools.filter((s) => !s.schoolId);
  const selectedNearbyCount = catalogNearby.filter(({ school }) => selectedCatalogIds.has(school.id)).length;

  if (!homePoint) {
    return (
      <Empty className="border p-6">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconMapPin size={18} />
          </EmptyMedia>
          <EmptyTitle>Set your home location first</EmptyTitle>
          <EmptyDescription>
            Nearby schools are counted around your actual home location - complete the Location
            step before this proximity criterion can be filled in.
          </EmptyDescription>
        </EmptyHeader>
        {onNavigateToLocation && (
          <EmptyContent>
            <Button type="button" variant="outline" onClick={onNavigateToLocation}>
              Go to Location step
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  const deduction = Math.max(0, maxMarks - schools.length * pointsPerSchool);

  const toggleCatalogSchool = (school: SchoolCatalogEntry) => {
    if (disabled) {
      return;
    }
    if (selectedCatalogIds.has(school.id)) {
      onChange(schools.filter((s) => s.schoolId !== school.id));
    } else {
      onChange([...schools, { lat: school.lat, lng: school.lng, schoolId: school.id, name: school.name }]);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="h-[360px] overflow-hidden rounded-lg border">
          <ClientOnly fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading map...</div>}>
            <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading map...</div>}>
              <NearbySchoolMapLazy
                home={homePoint}
                radiusKm={radiusKm}
                catalogSchools={catalogNearby.map((entry) => entry.school)}
                selectedCatalogIds={selectedCatalogIds}
                onToggleCatalogSchool={toggleCatalogSchool}
                manualPins={manualPins.map((s): [number, number] => [s.lat, s.lng])}
                onAdd={(lat, lng) => {
                  if (!disabled) {
                    onChange([...schools, { lat, lng }]);
                  }
                }}
              />
            </Suspense>
          </ClientOnly>
        </div>

        <div className="flex h-[360px] flex-col overflow-hidden rounded-lg border">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
            <div className="min-w-0">
              <span className="block text-sm font-medium">Schools nearby</span>
              <span className="block truncate text-[0.7rem] text-muted-foreground">
                Within {radiusKm.toFixed(1)}km of {targetSchoolName}
              </span>
          </div>
            <Badge variant="secondary">
              {selectedNearbyCount}/{catalogNearby.length}
            </Badge>
          </div>
          <TooltipProvider delay={200}>
            {proximity?.target && (
              <div className="flex shrink-0 items-center gap-2.5 border-b bg-muted/30 px-3 py-2 text-xs">
                <IconSchool className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{proximity.target.name}</span>
                  <span className="text-muted-foreground">Applied school \u2014 your reference point</span>
                </span>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        aria-label={`More info about ${proximity.target.name}`}
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      />
                    }
                  >
                    <IconInfoCircle className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    className="w-64 max-w-64 flex-col items-start gap-0 border bg-popover text-left text-popover-foreground"
                  >
                    <SchoolInfoTooltipContent school={proximity.target} />
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            {catalogNearby.length === 0 ? (
              <p className="flex flex-1 items-center justify-center px-4 text-center text-xs text-muted-foreground">
                No other catalog-listed schools within {radiusKm.toFixed(1)}km yet. Click the map
                to add one you know isn&apos;t listed.
              </p>
            ) : (
              <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
                {catalogNearby.map(({ school, distanceKm }) => {
                  const selected = selectedCatalogIds.has(school.id);
                  return (
                    <li
                      key={school.id}
                      className={cn("flex items-center gap-1 pr-1.5 transition-colors", selected && "bg-primary/5")}
                    >
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleCatalogSchool(school)}
                        className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-60"
                      >
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: distanceColor(distanceKm / radiusKm) }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{school.name}</span>
                          <span className="text-muted-foreground">{distanceKm.toFixed(1)} km away</span>
                        </span>
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded-full border",
                            selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                          )}
                        >
                          {selected && <IconCheck className="size-2.5" />}
                        </span>
                      </button>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              type="button"
                              aria-label={`More info about ${school.name}`}
                              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            />
                          }
                        >
                          <IconInfoCircle className="size-3.5" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="left"
                          className="w-64 max-w-64 flex-col items-start gap-0 border bg-popover text-left text-popover-foreground"
                        >
                          <SchoolInfoTooltipContent school={school} />
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            )}
          </TooltipProvider>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click a school \u2014 in the list or on the map \u2014 to mark it as nearby, or click empty map to
        add one not listed yet. Any gender-compatible school at least as close to your home as{" "}
        {targetSchoolName} ({radiusKm.toFixed(1)}km) counts against this criterion.
      </p>

      {manualPins.length > 0 && (
        <div className="grid gap-1">
          <p className="text-xs font-medium text-muted-foreground">Added manually (not in the catalog)</p>
          <ul className="grid gap-1">
            {manualPins.map((school, index) => (
              <li key={`${school.lat}-${school.lng}-${index}`} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {`Pin ${index + 1} - ${school.lat.toFixed(5)}, ${school.lng.toFixed(5)}`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => onChange(schools.filter((s) => s !== school))}
                >
                  <IconTrash className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Starts at {maxMarks} marks, -{pointsPerSchool} per school within {radiusKm.toFixed(1)}km ({schools.length}{" "}
        added &rarr; {deduction} marks).
      </p>
    </div>
  );
}
