import "leaflet/dist/leaflet.css";

import { divIcon, latLng } from "leaflet";
import { useEffect, useMemo } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Circle, MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { IconAlertTriangle, IconCheck, IconHome2, IconMapPin, IconSchool } from "@tabler/icons-react";

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

/**
 * A custom, themed marker icon (color + tabler icon, no default Leaflet pin
 * image) so every marker kind on the map is legible at a glance instead of
 * needing a click to tell them apart. `dashed` draws a dashed outline for the
 * "ghost" case \u2014 a school that's selected but has fallen outside the
 * currently-computed radius/list.
 */
function schoolDivIcon({
  Icon,
  color,
  size = 26,
  dashed = false,
}: {
  Icon: typeof IconSchool;
  color: string;
  size?: number;
  dashed?: boolean;
}) {
  const html = renderToStaticMarkup(
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        display: "grid",
        placeItems: "center",
        backgroundColor: color,
        border: dashed ? "2px dashed #fff" : "2px solid #fff",
        boxShadow: "0 1px 4px rgb(0 0 0 / 0.4)",
      }}
    >
      <Icon size={Math.round(size * 0.56)} color="#fff" stroke={2.25} />
    </div>
  );
  return divIcon({
    html,
    className: "nearby-school-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export interface NearbySchoolMapProps {
  /** The applicant's own home location \u2014 the proximity circle's center. */
  home: [number, number];
  /** Proximity radius, in kilometres, that the marking scheme scores schools within. */
  radiusKm: number;
  /** Real government schools from the catalog within `radiusKm` of `home`. */
  catalogSchools: SchoolCatalogEntry[];
  /** `id`s of `catalogSchools` the applicant has already marked as nearby. */
  selectedCatalogIds: Set<string | undefined>;
  /**
   * Selected schools that no longer fall within `catalogSchools` \u2014 e.g. the
   * applicant moved their home point after selecting them. Still count
   * toward the deduction, so they render as a distinct "ghost" marker
   * instead of silently vanishing (which read as the selection having been
   * lost, when it hadn't).
   */
  outOfRangeSchools: SchoolCatalogEntry[];
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
  outOfRangeSchools,
  onToggleCatalogSchool,
  manualPins,
  onAdd,
}: NearbySchoolMapProps) {
  // A little wider than the radius itself so markers right at the edge of
  // the circle aren't clipped flush against the viewport border.
  const bounds = latLng(home).toBounds(radiusKm * 1000 * 2.2);

  const homeIcon = useMemo(() => schoolDivIcon({ Icon: IconHome2, color: "#087f5b", size: 30 }), []);
  const selectedIcon = useMemo(() => schoolDivIcon({ Icon: IconCheck, color: "#b45309", size: 26 }), []);
  const unselectedIcon = useMemo(() => schoolDivIcon({ Icon: IconSchool, color: "#78716c", size: 22 }), []);
  const ghostIcon = useMemo(() => schoolDivIcon({ Icon: IconAlertTriangle, color: "#e11d48", size: 26, dashed: true }), []);
  const manualIcon = useMemo(() => schoolDivIcon({ Icon: IconMapPin, color: "#b45309", size: 26 }), []);

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
      <Marker position={home} icon={homeIcon}>
        <Tooltip className="school-tooltip">Home</Tooltip>
      </Marker>
      {catalogSchools.map((school) => {
        const selected = selectedCatalogIds.has(school.id);
        return (
          <Marker
            key={school.id}
            position={[school.lat, school.lng]}
            icon={selected ? selectedIcon : unselectedIcon}
            // A marker click must never also fire `MapClickHandler`'s underlying
            // map click (both would otherwise run against the same stale
            // `schools` snapshot and the last writer wins, silently dropping
            // this toggle and adding a nameless manual pin at the same spot).
            eventHandlers={{
              click: (event) => {
                event.originalEvent?.stopPropagation();
                onToggleCatalogSchool(school);
              },
            }}
          >
            <Tooltip className="school-tooltip">{selected ? `${school.name} (marked nearby)` : school.name}</Tooltip>
          </Marker>
        );
      })}
      {outOfRangeSchools.map((school) => (
        <Marker
          key={`ghost-${school.id}`}
          position={[school.lat, school.lng]}
          icon={ghostIcon}
          eventHandlers={{
            click: (event) => {
              event.originalEvent?.stopPropagation();
              onToggleCatalogSchool(school);
            },
          }}
        >
          <Tooltip className="school-tooltip">
            {`${school.name} \u2014 marked nearby, now outside the radius (click to remove)`}
          </Tooltip>
        </Marker>
      ))}
      {manualPins.map((pin, index) => (
        <Marker key={`${pin[0]}-${pin[1]}-${index}`} position={pin} icon={manualIcon} />
      ))}
    </MapContainer>
  );
}
