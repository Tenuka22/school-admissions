import { Badge } from "@school-admissions/ui/components/badge";
import { Button } from "@school-admissions/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@school-admissions/ui/components/card";
import { IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { LocalApplicationRef } from "@/lib/g1/local-applications";
import {
  forgetLocalApplication,
  listLocalApplications,
  rememberLocalApplication,
} from "@/lib/g1/local-applications";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [localApplications, setLocalApplications] = useState<LocalApplicationRef[]>([]);

  useEffect(() => {
    setLocalApplications(listLocalApplications());
  }, []);

  const versionsQuery = useQuery(orpc.admissions.listVersions.queryOptions());
  const latestVersion = versionsQuery.data?.[0];

  const createMutation = useMutation(
    orpc.admissions.createApplication.mutationOptions({
      onSuccess: (application) => {
        rememberLocalApplication({
          id: application.id,
          applicationNumber: application.applicationNumber,
          createdAt: application.createdAt,
        });
        navigate({ to: "/applications/$applicationId", params: { applicationId: application.id } });
      },
      onError: (error) => toast.error(error.message),
    })
  );

  return (
    <main className="mx-auto grid w-full max-w-2xl gap-6 p-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-semibold">Grade 1 Admissions</h1>
        <p className="text-sm text-muted-foreground">
          No account needed — start an application below and keep the link on this device to
          return to it later.
        </p>
      </div>

      <Button
        type="button"
        size="lg"
        className="mx-auto"
        disabled={!latestVersion || createMutation.isPending}
        onClick={() => {
          if (latestVersion) {
            createMutation.mutate({ versionKey: latestVersion.key });
          }
        }}
      >
        {createMutation.isPending ? "Starting..." : "Start new application"}
      </Button>

      {localApplications.length > 0 && (
        <div className="grid gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Applications started on this device
          </h2>
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
      )}
    </main>
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
      className="cursor-pointer"
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
