import { Badge } from "@school-admissions/ui/components/badge";
import { IconArrowBarDown, IconFlag3Filled, IconMinus } from "@tabler/icons-react";
import { cn } from "cn";

/** Small labeled number chip — used for flat per-item / per-year rates and caps. */
export function StatChip({
  label,
  value,
  unit,
  className,
}: {
  label: string;
  value: number | string;
  unit?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2 text-xs",
        className
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium text-foreground">
        {value}
        {unit ? <span className="ml-0.5 text-muted-foreground">{unit}</span> : null}
      </span>
    </div>
  );
}

/** Renders a `Record<string, number>` mark table (option → marks), e.g. document types, leadership roles. */
export function MarkTable({
  title,
  records,
  max,
  labelOverrides,
}: {
  title: string;
  records: Record<string, number>;
  max?: number;
  /** Clarifying label per option key, overriding the default humanized text. */
  labelOverrides?: Record<string, string>;
}) {
  const entries = Object.entries(records);
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">{title}</p>
        {max !== undefined && (
          <Badge variant="outline" className="font-mono text-[0.6875rem]">
            cap {max}
          </Badge>
        )}
      </div>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-xs">
          <tbody>
            {entries.map(([key, value], i) => (
              <tr key={key} className={cn(i > 0 && "border-t")}>
                <td className="px-3 py-1.5 text-muted-foreground">
                  {labelOverrides?.[key] ?? humanize(key)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono font-medium text-foreground">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Renders a `[threshold, marks][]` tier table, e.g. distance/period bands. */
export function TierTable({
  title,
  tiers,
  columns,
  max,
}: {
  title: string;
  tiers: [number, number][];
  columns: [string, string];
  max?: number;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">{title}</p>
        {max !== undefined && (
          <Badge variant="outline" className="font-mono text-[0.6875rem]">
            cap {max}
          </Badge>
        )}
      </div>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                {columns[0]}
              </th>
              <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">
                {columns[1]}
              </th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, i) => (
              <tr key={i} className={cn(i > 0 && "border-t")}>
                <td className="px-3 py-1.5 text-muted-foreground">{tier[0]}</td>
                <td className="px-3 py-1.5 text-right font-mono font-medium text-foreground">
                  {tier[1]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Renders a `[minKm, ratePerYear, tierCapMarks][]` triple-tier table (rate schedules). */
export function RateTierTable({
  title,
  tiers,
  columns,
  max,
}: {
  title: string;
  tiers: [number, number, number][];
  columns: [string, string, string];
  max?: number;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">{title}</p>
        {max !== undefined && (
          <Badge variant="outline" className="font-mono text-[0.6875rem]">
            cap {max}
          </Badge>
        )}
      </div>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((c) => (
                <th
                  key={c}
                  className="px-3 py-1.5 text-right font-medium text-muted-foreground first:text-left"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, i) => (
              <tr key={i} className={cn(i > 0 && "border-t")}>
                {tier.map((v, j) => (
                  <td
                    key={j}
                    className={cn(
                      "px-3 py-1.5 text-right font-mono font-medium text-foreground",
                      j === 0 && "text-left font-sans font-normal text-muted-foreground"
                    )}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Visualizes the map-proximity deduction mechanic: the category *starts* at
 * its cap and loses `perSchool` marks for every competing nearby school
 * found, floored at 0 — never accumulated upward. Color/icon-coded so the
 * direction (down, not up) reads at a glance instead of two bare numbers.
 */
export function ProximityScale({
  maxMarks,
  perSchool,
}: {
  maxMarks: number;
  perSchool: number;
}) {
  return (
    <div className="grid gap-1.5">
      <p className="text-xs font-medium text-foreground">Map proximity — deducts per nearby school</p>
      <div className="overflow-hidden rounded-md border">
        <div className="flex items-center justify-between bg-primary/10 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <IconFlag3Filled className="size-3.5" />
            Starts at
          </span>
          <span className="font-mono text-sm font-semibold text-primary">{maxMarks}</span>
    </div>
        <div className="flex items-center justify-between border-t bg-destructive/10 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <IconMinus className="size-3.5" />
            Per nearby school found
          </span>
          <span className="font-mono text-sm font-semibold text-destructive">
            −{perSchool}
          </span>
    </div>
        <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconArrowBarDown className="size-3.5" />
            Floor
          </span>
          <span className="font-mono text-sm font-semibold text-muted-foreground">0</span>
    </div>
    </div>
    </div>
  );
}

/** "camelCaseOrKebab-case" → "Camel Case Or Kebab Case". */
function humanize(key: string): string {
  return key
    .replace(/-/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}
