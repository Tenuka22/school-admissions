import {
  ADMISSION_VERSIONS,
  getFieldsForSubversion,
  getLatestSubversionNumber,
} from "@school-admissions/db/constants/admissionVersions/index";
import { INTAKE_YEAR_DEFAULT } from "@school-admissions/db/constants/markingVersions/shared/intake-year";
import {
  getCategoriesForSubversion,
  getLatestMarkingSubversionNumber,
} from "@school-admissions/db/constants/markingVersions/index";
import { Badge } from "@school-admissions/ui/components/badge";
import { Button } from "@school-admissions/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@school-admissions/ui/components/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@school-admissions/ui/components/empty";
import {
  IconBook2,
  IconClipboardList,
  IconDeviceMobile,
  IconFileText,
  IconMapPin,
  IconTrash,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useStartApplication } from "@/hooks/use-start-application";
import type { LocalApplicationRef } from "@/lib/g1/local-applications";
import { forgetLocalApplication, listLocalApplications } from "@/lib/g1/local-applications";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const STEPS = [
  {
    icon: IconMapPin,
    title: "Pin your location",
    description: "Capture your home on the map — it drives the proximity marks in category 6.1.",
  },
  {
    icon: IconFileText,
    title: "Fill in the form",
    description: "Child, guardian and residence details, saved step by step as you go.",
  },
  {
    icon: IconClipboardList,
    title: "Add your category",
    description: "Alumni, siblings, staff, transfer or foreign service — whichever applies.",
  },
  {
    icon: IconDeviceMobile,
    title: "Keep the link",
    description: "No account needed. This device remembers your application for later.",
  },
];

function HomePage() {
  const [localApplications, setLocalApplications] = useState<LocalApplicationRef[]>([]);
  const { start, canStart, isPending } = useStartApplication();

  useEffect(() => {
    setLocalApplications(listLocalApplications());
  }, []);

  const admissionSubversion = getLatestSubversionNumber("v1");
  const fieldCount = getFieldsForSubversion("v1", admissionSubversion)?.length ?? 0;
  const markingSubversion = getLatestMarkingSubversionNumber("v1");
  const categoryCount = getCategoriesForSubversion("v1", markingSubversion)?.length ?? 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="grid gap-8 py-14 text-center sm:py-20">
        <div className="mx-auto grid max-w-2xl gap-4">
          <Badge variant="outline" className="mx-auto w-fit font-mono">
            {ADMISSION_VERSIONS.v1.key} · intake {INTAKE_YEAR_DEFAULT}
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Grade 1 Admissions
          </h1>
          <p className="text-balance text-muted-foreground sm:text-lg">
            Apply for the {INTAKE_YEAR_DEFAULT} intake online — no account needed. Start an
            application below and keep the link on this device to return to it later.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            size="lg"
            disabled={!canStart || isPending}
            onClick={start}
          >
            {isPending ? "Starting..." : "Start new application"}
          </Button>
          <Button type="button" size="lg" variant="outline" render={<Link to="/docs" />}>
            <IconBook2 data-icon="inline-start" />
            How marks are allocated
          </Button>
        </div>

        <div className="mx-auto grid w-full max-w-2xl grid-cols-3 gap-3">
          <StatCard label="Form fields" value={fieldCount} />
          <StatCard label="Marking categories" value={categoryCount} />
          <StatCard label="Marks per category" value={100} />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="grid gap-6 border-t py-14">
        <div className="mx-auto grid max-w-lg gap-1.5 text-center">
          <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
          <p className="text-sm text-muted-foreground">Four steps, saved as you go.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="relative overflow-hidden">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-4.5" />
                  </span>
                  <span className="font-mono text-2xl font-semibold text-muted-foreground/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {step.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Docs teaser ───────────────────────────────────────────────── */}
      <section className="border-t py-14">
        <Card className="overflow-hidden bg-gradient-to-br from-card to-primary/5">
          <CardContent className="flex flex-col items-center gap-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="grid gap-1.5">
              <h2 className="text-lg font-semibold tracking-tight">
                Curious how the marks are worked out?
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                The documentation site breaks down every admission-form field and exactly how
                each of the six marking categories (6.1–6.6) allocates its 100 marks — generated
                straight from the live scoring rules.
              </p>
            </div>
            <Button render={<Link to="/docs" />} className="shrink-0">
              <IconBook2 data-icon="inline-start" />
              Open documentation
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ── Applications on this device ──────────────────────────────── */}
      <section className="grid gap-4 border-t py-14">
        <h2 className="text-sm font-medium text-muted-foreground">
          Applications started on this device
        </h2>
        {localApplications.length > 0 ? (
          <div className="grid gap-3">
            {localApplications.map((ref) => (
              <LocalApplicationCard
                key={ref.id}
                reference={ref}
                onRemove={() => {
                  forgetLocalApplication(ref.id);
                  setLocalApplications((prev) => prev.filter((a) => a.id !== ref.id));
                  toast.success("Removed from this device");
                }}
              />
            ))}
          </div>
        ) : (
          <Empty className="rounded-lg border border-dashed py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconFileText />
              </EmptyMedia>
              <EmptyTitle>No applications yet</EmptyTitle>
              <EmptyDescription>
                Start one above — it will show up here so you can pick up where you left off.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                type="button"
                size="sm"
                disabled={!canStart || isPending}
                onClick={start}
              >
                {isPending ? "Starting..." : "Start new application"}
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid gap-1 rounded-lg border bg-card px-3 py-3 text-center">
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
      <span className="text-[0.6875rem] text-muted-foreground">{label}</span>
    </div>
  );
}

function LocalApplicationCard({
  reference,
  onRemove,
}: {
  reference: LocalApplicationRef;
  onRemove: () => void;
}) {
  const navigate = useNavigate();
  const applicationQuery = useQuery({
    ...orpc.admissions.getApplication.queryOptions({ input: { id: reference.id } }),
    retry: false,
    meta: { skipErrorToast: true },
  });

  if (applicationQuery.isError) {
    return null;
  }

  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary/40"
      onClick={() =>
        navigate({ to: "/applications/$applicationId", params: { applicationId: reference.id } })
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {applicationQuery.data?.applicationNumber ?? reference.applicationNumber}
          <div className="flex items-center gap-2">
            {applicationQuery.data && (
              <Badge variant={applicationQuery.data.status === "draft" ? "secondary" : "default"}>
                {applicationQuery.data.status}
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              aria-label="Remove from this device"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <IconTrash className="size-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {applicationQuery.data
          ? `Version ${applicationQuery.data.versionKey}.${applicationQuery.data.currentSubversion}`
          : "Loading..."}
      </CardContent>
    </Card>
  );
}
