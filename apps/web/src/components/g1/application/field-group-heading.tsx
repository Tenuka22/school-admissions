/** Small uppercase section heading used to divide a step's fields into groups (e.g. "Permanent Address"). */
export function FieldGroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b pb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  );
}
