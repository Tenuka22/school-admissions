import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { rememberLocalApplication } from "@/lib/g1/local-applications";
import { orpc } from "@/utils/orpc";

export function useStartApplication() {
  const navigate = useNavigate();
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

  return {
    start: () => {
      if (latestVersion) {
        createMutation.mutate({ versionKey: latestVersion.key });
      }
    },
    canStart: Boolean(latestVersion),
    isPending: createMutation.isPending,
  };
}
