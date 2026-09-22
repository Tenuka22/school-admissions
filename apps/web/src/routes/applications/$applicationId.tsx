import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { ApplicationForm } from "@/components/g1/application/application-form";
import { rememberLocalApplication } from "@/lib/g1/local-applications";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/applications/$applicationId")({
  component: ApplicationDetailPage,
});

function ApplicationDetailPage() {
  const { applicationId } = Route.useParams();
  const applicationQuery = useQuery(
    orpc.admissions.getApplication.queryOptions({ input: { id: applicationId } })
  );

  useEffect(() => {
    if (applicationQuery.data) {
      rememberLocalApplication({
        id: applicationQuery.data.id,
        applicationNumber: applicationQuery.data.applicationNumber,
        createdAt: applicationQuery.data.createdAt,
      });
    }
  }, [applicationQuery.data]);

  if (applicationQuery.isPending) {
    return <main className="grid min-h-svh place-items-center p-6 text-sm text-muted-foreground">Loading...</main>;
  }
  if (applicationQuery.isError || !applicationQuery.data) {
    return (
      <main className="grid min-h-svh place-items-center p-6 text-sm text-muted-foreground">
        Application not found. Double-check the link.
      </main>
    );
  }

  return (
    <ApplicationForm
      application={{
        id: applicationQuery.data.id,
        applicationNumber: applicationQuery.data.applicationNumber,
        versionKey: applicationQuery.data.versionKey,
        currentSubversion: applicationQuery.data.currentSubversion,
        latestSubversion: applicationQuery.data.latestSubversion,
        status: applicationQuery.data.status,
        data: (applicationQuery.data.data as Record<string, unknown> | null) ?? null,
        updateNeeded: applicationQuery.data.updateNeeded,
        newFields: applicationQuery.data.newFields,
        newlyRequired: applicationQuery.data.newlyRequired,
        removedFields: applicationQuery.data.removedFields,
        renamed: applicationQuery.data.renamed,
      }}
    />
  );
}
