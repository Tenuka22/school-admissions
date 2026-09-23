import { Badge } from "@school-admissions/ui/components/badge";
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

/** "camelCaseOrKebab-case" → "Camel Case Or Kebab Case". */
function humanize(key: string): string {
  return key
    .replace(/-/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}
