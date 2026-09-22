import "leaflet/dist/leaflet.css";

import { latLng } from "leaflet";
import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";

import type { SchoolCatalogEntry } from "@school-admissions/db/constants/schools/index";

/** Re-measures the map once its container has its real size (guards against a zero-size flash on first paint). */
function MapResizeSync() {
  const map = useMap();
  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    return () => cancelAnimationFrame(frame);
  }, [map]);
  return null;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => {
      // A click on a marker/circle already ran that layer's own handler.
      // A marker's `eventHandlers.click` stopping propagation on the
      // underlying native event is the documented way to keep this map-level
      // handler from ALSO firing, but that hasn't proven reliable across
      // every click-dispatch path here - checking the actual DOM target is a
      // second, independent guard so a marker click can never also register
      // as "empty map click, add a manual pin" (which silently drops the
      // catalog toggle's schoolId/name by racing it with a nameless entry).
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest("path.leaflet-interactive")) {
        return;
      }
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export interface NearbySchoolMapProps {
  /** The applicant's own home location — the proximity circle's center. */
  home: [number, number];
  /** Proximity radius, in kilometres, that the marking scheme scores schools within. */
  radiusKm: number;
  /** Real government schools from the catalog within `radiusKm` of `home`. */
  catalogSchools: SchoolCatalogEntry[];
  /** `id`s of `catalogSchools` the applicant has already marked as nearby. */
  selectedCatalogIds: Set<string | undefined>;
  /** Clicking a catalog marker toggles it in/out of the applicant's selection. */
  onToggleCatalogSchool: (school: SchoolCatalogEntry) => void;
  /** Manually-dropped pins for schools not yet in the catalog (legacy/uncovered areas). */
  manualPins: Array<[number, number]>;
  /** Clicking empty map (outside any marker) adds a manual pin, for schools the catalog doesn't have yet. */
  onAdd: (lat: number, lng: number) => void;
}

/**
 * A real map of the applicant's neighbourhood, centered on their own home
 * with the marking scheme's proximity radius drawn as a circle. Real,
 * Google-Maps-verified government schools within that radius (see
 * `@school-admissions/db/constants/schools`) render as clickable markers —
 * amber for not-yet-selected, green for selected, matching the home pin.
 * Areas the catalog hasn't covered yet still support a manual pin via
 * clicking empty map, so the criterion never blocks on scrape coverage.
 *
 * The initial view fits the FULL `radiusKm` circle (not a fixed zoom level)
 * — a fixed city-block zoom would leave every catalog school more than ~1km
 * out invisible off-screen, unclickable, and easy to mistake for "the
 * catalog has no coverage here" when it's really just scrolled out of view.
 */
export function NearbySchoolMap({
  home,
  radiusKm,
  catalogSchools,
  selectedCatalogIds,
  onToggleCatalogSchool,
  manualPins,
  onAdd,
}: NearbySchoolMapProps) {
  // A little wider than the radius itself so markers right at the edge of
  // the circle aren't clipped flush against the viewport border.
  const bounds = latLng(home).toBounds(radiusKm * 1000 * 2.2);

  return (
    <MapContainer bounds={bounds} scrollWheelZoom className="z-0 h-full w-full cursor-crosshair">
      <MapResizeSync />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onPick={onAdd} />
      <Circle
        center={home}
        radius={radiusKm * 1000}
        pathOptions={{ color: "#087f5b", fillColor: "#13b77e", fillOpacity: 0.08, weight: 2, dashArray: "4 4" }}
      />
      <CircleMarker
        center={home}
        radius={10}
        pathOptions={{ color: "#087f5b", fillColor: "#13b77e", fillOpacity: 0.9, weight: 3 }}
      />
      {catalogSchools.map((school) => {
        const selected = selectedCatalogIds.has(school.id);
        return (
          <CircleMarker
            key={school.id}
            center={[school.lat, school.lng]}
            radius={selected ? 9 : 7}
            pathOptions={
              selected
                ? { color: "#b45309", fillColor: "#f59e0b", fillOpacity: 0.85, weight: 2 }
                : { color: "#78716c", fillColor: "#d6d3d1", fillOpacity: 0.6, weight: 1.5 }
            }
            // A marker click must never also fire `MapClickHandler`'s underlying
            // map click (both would otherwise run against the same stale
            // `schools` snapshot and the last writer wins, silently dropping
            // this toggle and adding a nameless manual pin at the same spot).
            eventHandlers={{
              click: (event) => {
                event.originalEvent.stopPropagation();
                onToggleCatalogSchool(school);
              },
            }}
          >
            <Tooltip className="school-tooltip">{selected ? `${school.name} (marked nearby)` : school.name}</Tooltip>
          </CircleMarker>
        );
      })}
      {manualPins.map((pin, index) => (
        <CircleMarker
          key={`${pin[0]}-${pin[1]}-${index}`}
          center={pin}
          radius={9}
          pathOptions={{ color: "#b45309", fillColor: "#f59e0b", fillOpacity: 0.85, weight: 2 }}
        />
      ))}
    </MapContainer>
  );
}
