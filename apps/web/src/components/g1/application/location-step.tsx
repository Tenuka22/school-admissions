import type { LocationCaptureConfig } from "@school-admissions/db/constants/admissionVersions/index";
import { Button } from "@school-admissions/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@school-admissions/ui/components/field";
import { Input } from "@school-admissions/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@school-admissions/ui/components/popover";
import { ToggleGroup, ToggleGroupItem } from "@school-admissions/ui/components/toggle-group";
import { ClientOnly } from "@tanstack/react-router";
import {
  IconAlertTriangle,
  IconCheck,
  IconLocation,
  IconMapPin,
  IconPencil,
  IconSettings,
  IconX,
} from "@tabler/icons-react";
import { lazy, Suspense, useMemo, useState } from "react";

import { formatDms, latitudeHemisphere, longitudeHemisphere, parseDmsPair } from "@/lib/g1/dms";

const LocationStepMapLazy = lazy(() =>
  import("./location-step-map").then((m) => ({ default: m.LocationStepMap }))
);

interface LocationErrorState {
  title: string;
  message: string;
}

function geolocationErrorMessage(error: GeolocationPositionError): LocationErrorState {
  if (error.code === error.PERMISSION_DENIED) {
    return {
      title: "Location permission blocked",
      message: "Allow location access in your browser, or enter coordinates manually below.",
    };
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return {
      title: "Couldn't get a location fix",
      message: "Try again, or enter coordinates manually below.",
    };
  }
  return {
    title: "Location request timed out",
    message: "Try again, or enter coordinates manually below.",
  };
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) {
      return null;
    }
    const body: { display_name?: string } = await res.json();
    return body.display_name ?? null;
  } catch {
    return null;
  }
}

export interface LocationStepProps {
  /** Version-driven capture behaviour (GPS/manual toggles, formats, target field keys). */
  config: LocationCaptureConfig;
  data: Record<string, unknown>;
  disabled?: boolean;
  onChange: (patch: Record<string, unknown>) => void;
}

/**
 * The whole "location" step is a single cohesive capture experience — GPS,
 * manual coordinates and the address text all write into the field keys
 * named by `config` (version-driven, not hard-coded). The map never sets a
 * point directly from a click: an applicant must enter explicit "edit on
 * map" mode, place a pending point, and confirm it after checking it's
 * correct before it's applied.
 */
export function LocationStep({ config, data, disabled, onChange }: LocationStepProps) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState<LocationErrorState | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapEditMode, setMapEditMode] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<[number, number] | null>(null);
  const [manualPreviewPoint, setManualPreviewPoint] = useState<[number, number] | null>(null);

  const latitude = typeof data[config.latitudeField ?? ""] === "number" ? (data[config.latitudeField ?? ""] as number) : null;
  const longitude = typeof data[config.longitudeField ?? ""] === "number" ? (data[config.longitudeField ?? ""] as number) : null;
  const address = typeof data[config.addressField ?? ""] === "string" ? (data[config.addressField ?? ""] as string) : "";
  const point = useMemo<[number, number] | null>(
    () => (latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null),
    [latitude, longitude]
  );

  const setAddress = (value: string) => {
    const patch: Record<string, unknown> = {};
    if (config.addressField) patch[config.addressField] = value;
    if (config.labelField) patch[config.labelField] = value;
    onChange(patch);
  };

  const applyPoint = async (lat: number, lng: number, source: string) => {
    setError(null);
    const patch: Record<string, unknown> = {};
    if (config.latitudeField) patch[config.latitudeField] = lat;
    if (config.longitudeField) patch[config.longitudeField] = lng;
    if (config.sourceField) patch[config.sourceField] = source;
    onChange(patch);

    setStatus("Finding address...");
    const resolved = await reverseGeocode(lat, lng);
    const finalAddress = resolved ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setAddress(finalAddress);
    setStatus("");
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setError({ title: "Location not supported", message: "This browser can't provide a location — enter coordinates manually below." });
      return;
    }
    setError(null);
    setLocating(true);
    setStatus("Finding your current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        void applyPoint(position.coords.latitude, position.coords.longitude, "device");
      },
      (geoError) => {
        setLocating(false);
        setStatus("");
        setError(geolocationErrorMessage(geoError));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const clearSelection = () => {
    setError(null);
    setStatus("");
    const patch: Record<string, unknown> = {};
    if (config.latitudeField) patch[config.latitudeField] = null;
    if (config.longitudeField) patch[config.longitudeField] = null;
    if (config.sourceField) patch[config.sourceField] = null;
    if (config.addressField) patch[config.addressField] = null;
    if (config.labelField) patch[config.labelField] = null;
    onChange(patch);
  };

  const confirmPendingPoint = () => {
    if (!pendingPoint) {
      return;
    }
    void applyPoint(pendingPoint[0], pendingPoint[1], "map");
    setPendingPoint(null);
    setMapEditMode(false);
  };

  return (
    <div className="grid grid-cols-[minmax(260px,.9fr)_minmax(0,1.3fr)] gap-6 max-lg:grid-cols-1">
      <div className="grid content-start gap-4">
        <Field>
          <FieldLabel>Address</FieldLabel>
          <FieldDescription>Looked up automatically from the point you pick below.</FieldDescription>
          <p className="text-sm text-foreground">
            {address || <span className="text-muted-foreground">No address yet — set a location below.</span>}
          </p>
        </Field>

        {!disabled && (
          <div className="flex gap-2">
            {config.enableGps && (
              <Button
                type="button"
                variant="secondary"
                className="h-auto min-h-10 flex-1 whitespace-normal"
                disabled={locating}
                onClick={useDeviceLocation}
              >
                <IconLocation className="shrink-0" size={17} />
                {locating ? "Locating..." : "Use my location"}
              </Button>
            )}
            {config.enableManualEntry && (
              <Popover
                open={manualOpen}
                onOpenChange={(next) => {
                  setManualOpen(next);
                  if (!next) {
                    setManualPreviewPoint(null);
                  }
                }}
              >
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="aspect-square size-10 shrink-0"
                      title="Enter coordinates manually"
                      aria-label="Enter coordinates manually"
                    />
                  }
                >
                  <IconSettings size={17} />
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  {manualOpen && (
                    <ManualCoordinatesForm
                      point={point}
                      onPreviewChange={setManualPreviewPoint}
                      onApply={(lat, lng) => {
                        setManualOpen(false);
                        setManualPreviewPoint(null);
                        void applyPoint(lat, lng, "manual");
                      }}
                    />
                  )}
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}

        {error && !disabled && (
          <div className="grid gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3" role="alert">
            <div className="flex items-start gap-2 text-sm">
              <IconAlertTriangle className="mt-0.5 shrink-0 text-destructive" size={17} />
              <div>
                <p className="font-semibold text-destructive">{error.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {status && !error && (
          <p className="text-sm text-primary" role="status">
            {status}
          </p>
        )}

        {point && (
          <div className="grid gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3" aria-live="polite">
            <p className="text-sm font-semibold text-primary">Selected location</p>
            <div className="grid gap-2 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <span className="text-muted-foreground">Decimal</span>
                <code className="break-all font-medium tabular-nums text-foreground">
                  {point[0].toFixed(5)}, {point[1].toFixed(5)}
                </code>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <span className="text-muted-foreground">DMS</span>
                <code className="break-all font-medium tabular-nums text-foreground">
                  {formatDms(point[0], latitudeHemisphere(point[0]))}, {formatDms(point[1], longitudeHemisphere(point[1]))}
                </code>
              </div>
            </div>
            {!disabled && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                  onClick={clearSelection}
                >
                  <IconX className="shrink-0" size={14} />
                  Clear selection
                </Button>
              </div>
            )}
          </div>
        )}

        {!point && !error && (
          <p className="flex flex-row items-center gap-2 text-sm text-muted-foreground">
            <IconMapPin size={16} />
            Set a location to continue.
          </p>
        )}
      </div>

      {config.enableMapPin && (
        <div className="grid content-start gap-2">
          {!disabled && (
            <div className="flex items-center justify-between gap-2">
              {mapEditMode ? (
                <div className="flex flex-1 items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs">
                  <span className="flex-1 text-amber-700 dark:text-amber-400">
                    {pendingPoint
                      ? `Pending point: ${pendingPoint[0].toFixed(5)}, ${pendingPoint[1].toFixed(5)} — verify it's correct.`
                      : "Click a point on the map to place a pin."}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setMapEditMode(false);
                      setPendingPoint(null);
                    }}
                  >
                    <IconX size={14} />
                    Cancel
                  </Button>
                  <Button type="button" size="sm" disabled={!pendingPoint} onClick={confirmPendingPoint}>
                    <IconCheck size={14} />
                    Use this point
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => setMapEditMode(true)}>
                  <IconPencil size={14} />
                  Edit on map
                </Button>
              )}
            </div>
          )}
          <div className="h-[420px] overflow-hidden rounded-lg border max-lg:h-[320px]">
            <ClientOnly fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading map...</div>}>
              <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading map...</div>}>
                <LocationStepMapLazy
                  point={point}
                  pendingPoint={pendingPoint}
                  previewPoint={manualPreviewPoint}
                  editMode={mapEditMode}
                  onPick={(lat, lng) => setPendingPoint([lat, lng])}
                />
              </Suspense>
            </ClientOnly>
          </div>
        </div>
      )}
    </div>
  );
}

type CoordinateInputMode = "decimal" | "dms";

/** Parses whichever mode's fields are live into a validated `[lat, lng]`, or `null` if incomplete/out of range. */
function computePreviewPoint(
  mode: CoordinateInputMode,
  latStr: string,
  lngStr: string,
  dmsStr: string
): [number, number] | null {
  if (mode === "dms") {
    const pair = parseDmsPair(dmsStr);
    return pair ? [pair.lat, pair.lng] : null;
  }
  const latNum = Number(latStr);
  const lngNum = Number(lngStr);
  if (latStr.trim() === "" || lngStr.trim() === "" || !Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return null;
  }
  return latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180 ? [latNum, lngNum] : null;
}

/**
 * Toggles between decimal and DMS *input* \u2014 switching preserves whatever
 * was typed by converting it, so nothing is lost. The read-only DMS/decimal
 * conversion of the already-applied point lives in "Selected location"
 * instead; this popover is only for entering a new one.
 */
function ManualCoordinatesForm({
  point,
  onPreviewChange,
  onApply,
}: {
  point: [number, number] | null;
  onPreviewChange: (point: [number, number] | null) => void;
  onApply: (lat: number, lng: number) => void;
}) {
  const [mode, setMode] = useState<CoordinateInputMode>("decimal");
  // Popover content is only mounted while open (see the call site), so these
  // initializers run fresh every time it's opened \u2014 no effect needed to sync
  // with whatever's already selected.
  const [lat, setLat] = useState(point ? point[0].toFixed(6) : "");
  const [lng, setLng] = useState(point ? point[1].toFixed(6) : "");
  // DMS mode is a single free-form field \u2014 typing or pasting a coordinate like
  // `6\u00b003'14.42"N 80\u00b012'39.54"E` auto-splits it into latitude and longitude.
  const [dmsText, setDmsText] = useState(
    point ? `${formatDms(point[0], latitudeHemisphere(point[0]))} ${formatDms(point[1], longitudeHemisphere(point[1]))}` : ""
  );
  const [invalid, setInvalid] = useState(false);
  const dmsPair = mode === "dms" ? parseDmsPair(dmsText) : null;

  // Reports the currently typed/pasted-but-not-yet-applied coordinate so the map can
  // draw a distinct preview marker for it \u2014 called straight from each edit instead
  // of watching state with an effect. Nothing to report until the applicant actually
  // changes something, since the fields start out matching whatever's already applied.
  const reportPreview = (nextMode: CoordinateInputMode, latStr: string, lngStr: string, dmsStr: string) => {
    onPreviewChange(computePreviewPoint(nextMode, latStr, lngStr, dmsStr));
  };

  const currentLat = (): number | null => {
    if (mode === "dms") {
      return dmsPair?.lat ?? null;
    }
    const num = Number(lat);
    return lat.trim() !== "" && Number.isFinite(num) ? num : null;
  };
  const currentLng = (): number | null => {
    if (mode === "dms") {
      return dmsPair?.lng ?? null;
    }
    const num = Number(lng);
    return lng.trim() !== "" && Number.isFinite(num) ? num : null;
  };

  const switchMode = (nextMode: CoordinateInputMode) => {
    if (nextMode === mode) {
      return;
    }
    let nextLat = lat;
    let nextLng = lng;
    let nextDmsText = dmsText;
    if (nextMode === "dms") {
      // Converting FROM decimal: carry whatever was typed into the DMS text.
      const latNum = Number(lat);
      const lngNum = Number(lng);
      const hasLat = lat.trim() !== "" && Number.isFinite(latNum);
      const hasLng = lng.trim() !== "" && Number.isFinite(lngNum);
      if (hasLat || hasLng) {
        const latText = hasLat ? formatDms(latNum, latitudeHemisphere(latNum)) : "";
        const lngText = hasLng ? formatDms(lngNum, longitudeHemisphere(lngNum)) : "";
        nextDmsText = [latText, lngText].filter(Boolean).join(" ");
        setDmsText(nextDmsText);
      }
    } else {
      // Converting FROM DMS: carry the equivalent decimal values over.
      const pair = parseDmsPair(dmsText);
      if (pair) {
        nextLat = pair.lat.toFixed(6);
        nextLng = pair.lng.toFixed(6);
        setLat(nextLat);
        setLng(nextLng);
      }
    }
    setInvalid(false);
    setMode(nextMode);
    reportPreview(nextMode, nextLat, nextLng, nextDmsText);
  };

  const apply = () => {
    const latNum = currentLat();
    const lngNum = currentLng();
    if (latNum === null || lngNum === null || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setLat("");
    setLng("");
    setDmsText("");
    onApply(latNum, lngNum);
  };

  return (
    <div className="grid gap-3">
      <PopoverHeader>
        <PopoverTitle>Manual coordinates</PopoverTitle>
        <PopoverDescription>Enter latitude/longitude as decimal or degrees/minutes/seconds.</PopoverDescription>
      </PopoverHeader>

      <ToggleGroup
        value={[mode]}
        onValueChange={(next) => next[0] && switchMode(next[0] as CoordinateInputMode)}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <ToggleGroupItem value="decimal" className="flex-1">
          Decimal
        </ToggleGroupItem>
        <ToggleGroupItem value="dms" className="flex-1">
          DMS
        </ToggleGroupItem>
      </ToggleGroup>

      {mode === "decimal" ? (
        <div className="grid grid-cols-2 gap-2">
          <Field>
            <FieldLabel htmlFor="manual-lat" className="text-xs">Latitude</FieldLabel>
            <Input
              id="manual-lat"
              type="number"
              step="any"
              inputMode="decimal"
              value={lat}
              placeholder="6.9271"
              onChange={(e) => {
                setInvalid(false);
                setLat(e.target.value);
                reportPreview("decimal", e.target.value, lng, dmsText);
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="manual-lng" className="text-xs">Longitude</FieldLabel>
            <Input
              id="manual-lng"
              type="number"
              step="any"
              inputMode="decimal"
              value={lng}
              placeholder="79.8612"
              onChange={(e) => {
                setInvalid(false);
                setLng(e.target.value);
                reportPreview("decimal", lat, e.target.value, dmsText);
              }}
            />
          </Field>
        </div>
      ) : (
        <Field>
          <FieldLabel htmlFor="manual-dms" className="text-xs">Latitude, longitude</FieldLabel>
          <Input
            id="manual-dms"
            type="text"
            value={dmsText}
            placeholder={`6\u00b003'14.42"N 80\u00b012'39.54"E`}
            onChange={(e) => {
              setInvalid(false);
              setDmsText(e.target.value);
              reportPreview("dms", lat, lng, e.target.value);
            }}
          />
          <FieldDescription className="text-[0.65rem]">
            Type or paste both coordinates — degrees, minutes, seconds and hemisphere are split out automatically.
          </FieldDescription>
          {dmsPair && (
            <p className="text-xs text-muted-foreground">
              {dmsPair.lat.toFixed(6)}, {dmsPair.lng.toFixed(6)}
            </p>
          )}
        </Field>
      )}

      {invalid && <p className="text-xs text-destructive">Enter a valid latitude (-90 to 90) and longitude (-180 to 180).</p>}
      <Button type="button" size="sm" className="w-full" onClick={apply}>
        Apply coordinates
      </Button>
    </div>
  );
}
