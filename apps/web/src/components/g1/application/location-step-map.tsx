import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

const DEFAULT_CENTER: [number, number] = [7.8731, 80.7718]; // Sri Lanka centroid
const DEFAULT_ZOOM = 7;
const SELECTED_ZOOM = 15;

/** Re-measures the map once its container has its real size (guards against a zero-size flash on first paint). */
function MapResizeSync() {
  const map = useMap();
  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    return () => cancelAnimationFrame(frame);
  }, [map]);
  return null;
}

/** Only active in edit mode — clicking drops a *pending* point, never commits it directly. */
function MapClickHandler({ active, onPick }: { active: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => {
      if (active) {
        onPick(event.latlng.lat, event.latlng.lng);
      }
    },
  });
  return null;
}

function FlyToPoint({ point }: { point: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) {
      map.flyTo(point, Math.max(map.getZoom(), SELECTED_ZOOM), { duration: 0.6 });
    }
  }, [map, point]);
  return null;
}

export interface LocationStepMapProps {
  /** The committed, saved point. */
  point: [number, number] | null;
  /** A clicked-but-not-yet-confirmed point, shown distinctly while awaiting confirmation. */
  pendingPoint?: [number, number] | null;
  /** A typed/pasted-but-not-yet-applied manual coordinate, shown distinctly while it's being edited. */
  previewPoint?: [number, number] | null;
  /** Whether map clicks are currently accepted (explicit "edit on map" mode). */
  editMode?: boolean;
  onPick?: (lat: number, lng: number) => void;
}

/**
 * Map clicks only register a *pending* point (amber ring) — they never
 * silently overwrite the saved location. The applicant must be in explicit
 * "edit on map" mode to place one, then confirm it before it's applied.
 */
export function LocationStepMap({
  point,
  pendingPoint = null,
  previewPoint = null,
  editMode = false,
  onPick,
}: LocationStepMapProps) {
  // Only worth drawing the preview marker once it actually differs from the applied point.
  const changedPreview =
    previewPoint && (!point || previewPoint[0] !== point[0] || previewPoint[1] !== point[1]) ? previewPoint : null;
  // Typing a replacement coordinate previews it as a marker but must never pan the map away
  // from (or otherwise disturb) the already-applied point — only fly to the preview when
  // there's no applied point yet to preserve.
  const focusPoint = pendingPoint ?? point ?? changedPreview;
  return (
    <MapContainer
      center={focusPoint ?? DEFAULT_CENTER}
      zoom={focusPoint ? SELECTED_ZOOM : DEFAULT_ZOOM}
      scrollWheelZoom
      className={`z-0 h-full w-full ${editMode ? "cursor-crosshair" : ""}`}
    >
      <MapResizeSync />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {editMode && onPick && <MapClickHandler active={editMode} onPick={onPick} />}
      <FlyToPoint point={focusPoint} />
      {point && (
        <CircleMarker
          center={point}
          radius={10}
          pathOptions={{ color: "#087f5b", fillColor: "#13b77e", fillOpacity: 0.9, weight: 3 }}
        />
      )}
      {pendingPoint && (
        <CircleMarker
          center={pendingPoint}
          radius={11}
          pathOptions={{ color: "#b45309", fillColor: "#f59e0b", fillOpacity: 0.55, weight: 3, dashArray: "4 3" }}
        />
      )}
      {changedPreview && (
        <CircleMarker
          center={changedPreview}
          radius={11}
          pathOptions={{ color: "#1d4ed8", fillColor: "#60a5fa", fillOpacity: 0.55, weight: 3, dashArray: "2 2" }}
        />
      )}
    </MapContainer>
  );
}
