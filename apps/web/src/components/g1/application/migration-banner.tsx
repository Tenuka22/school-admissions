import type { AdmissionFieldDefinition } from "@school-admissions/db/constants/admissionVersions/index";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@school-admissions/ui/components/alert";
import { IconRefresh } from "@tabler/icons-react";

export interface RenamedFieldInfo {
  oldKey: string;
  field: AdmissionFieldDefinition;
}

export interface MigrationBannerProps {
  currentSubversion: number;
  latestSubversion: number;
  newFields: AdmissionFieldDefinition[];
  newlyRequired: AdmissionFieldDefinition[];
  removedFields: AdmissionFieldDefinition[];
  renamed: RenamedFieldInfo[];
}

/**
 * Surfaces every variation `calculateMigrationRequirements` can report: this
 * application was created under an older admission subversion than the one
 * currently live. Submitting the form migrates it to the latest subversion
 * and logs the bump — this banner is the "a field got added while you were
 * away" prompt for whatever actually changed (added, newly required,
 * removed, or renamed), driven entirely by the subversion deltas.
 */
export function MigrationBanner({
  currentSubversion,
  latestSubversion,
  newFields,
  newlyRequired,
  removedFields,
  renamed,
}: MigrationBannerProps) {
  return (
    <Alert>
      <IconRefresh />
      <AlertTitle>
        The application form was updated (v{currentSubversion} → v{latestSubversion}) while this
        draft was open
      </AlertTitle>
      <AlertDescription>
        <p>Submitting will migrate your application to the latest version.</p>
        {newFields.length > 0 && (
          <p>
            <strong>New fields added:</strong> {newFields.map((f) => f.label).join(", ")}
          </p>
        )}
        {newlyRequired.length > 0 && (
          <p>
            <strong>Now required:</strong> {newlyRequired.map((f) => f.label).join(", ")}
          </p>
        )}
        {renamed.length > 0 && (
          <p>
            <strong>Renamed:</strong>{" "}
            {renamed.map((r) => `${r.oldKey} → ${r.field.label}`).join(", ")}
          </p>
        )}
        {removedFields.length > 0 && (
          <p>
            <strong>No longer needed:</strong> {removedFields.map((f) => f.label).join(", ")}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
