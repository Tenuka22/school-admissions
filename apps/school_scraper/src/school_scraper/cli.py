from __future__ import annotations

import argparse
import json
import random
import sys
import time
from pathlib import Path
from typing import Any

from .csv_loader import load_schools
from .models import MapPlace, SourceSchool
from .scraper import GoogleMapsScraper

# School names/addresses contain non-ASCII characters; make sure printing them
# to a redirected stdout (cp1252 on Windows) cannot crash a long-running scrape.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

# apps/school_scraper/src/school_scraper/cli.py -> apps/school_scraper
APP_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = APP_ROOT / "data" / "schools.csv"
DEFAULT_OUTPUT = APP_ROOT / "data" / "schools_map_data.json"
DEFAULT_CACHE = APP_ROOT / "data" / "schools_map_cache.json"

# Below this name-similarity score a Maps result is kept in the cache (so it is
# never re-requested) but flagged "no-match" rather than "matched".
MATCH_THRESHOLD = 0.45


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape Google Maps details (coordinates, address, phone, website, rating) "
        "for every school in the government school listing CSV."
    )
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE, help="Schools CSV source")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Output JSON file (full snapshot)")
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE, help="Resumable per-school cache JSON")
    parser.add_argument("--limit", type=int, default=None, help="Process at most N schools (useful for testing)")
    parser.add_argument("--start", type=int, default=0, help="Skip the first N schools in the (filtered) listing")
    parser.add_argument("--district", type=str, default=None, help="Only process schools in this district")
    parser.add_argument("--province", type=str, default=None, help="Only process schools in this province")
    parser.add_argument("--school-id", type=str, default=None, help="Only process a single school_id")
    parser.add_argument("--headless", dest="headless", action="store_true", default=True, help="Run headless (default)")
    parser.add_argument("--headed", dest="headless", action="store_false", help="Show the browser window")
    parser.add_argument("--delay", type=float, default=2.0, help="Delay between lookups in seconds (default 2.0)")
    parser.add_argument("--candidates", type=int, default=3, help="Map result cards considered per school (default 3)")
    parser.add_argument(
        "--retry-failed",
        action="store_true",
        help="Re-attempt schools already cached as no-match/no-result/error",
    )
    parser.add_argument("--save-every", type=int, default=5, help="Persist the cache to disk every N lookups")
    parser.add_argument(
        "--export-catalog",
        type=Path,
        default=None,
        help="Also write a slim {id,name,lat,lng,address,district,division} catalog "
        "of every 'matched' cache entry to this path (e.g. the web app's schools "
        "catalog). Uses the FULL cache regardless of --district/--province/--limit, "
        "so it's safe to run standalone with --limit 0 to just refresh the catalog.",
    )
    return parser.parse_args(argv)


def load_cache(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def save_cache(path: Path, cache: dict[str, dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_record(school: SourceSchool, place: MapPlace | None, score: float, status: str) -> dict[str, Any]:
    return {
        "school_id": school.school_id,
        "census_no": school.census_no,
        "source": school.to_dict(),
        "google": place.to_dict() if place is not None else None,
        "match_score": round(score, 3) if place is not None else None,
        "status": status,
        "scraped_at": round(time.time(), 1),
    }


def export_catalog(cache: dict[str, dict[str, Any]], path: Path) -> int:
    """Write a slim, web-app-ready catalog of every 'matched' cache entry.

    The full cache record carries every raw CSV column plus the entire Maps
    response for auditing; downstream UI (a school picker on a map) only
    needs a slim subset - identity, location, gender-compatible proximity
    filtering, and enough Ministry/Maps detail (category, grades, medium,
    contact) for a "show more info" expansion in the picker UI. Sorted by
    district then name so diffs stay small across re-exports.
    """
    records = []
    for school_id, record in cache.items():
        if record.get("status") != "matched":
            continue
        google = record.get("google") or {}
        source = record.get("source") or {}
        lat, lng = google.get("latitude"), google.get("longitude")
        if lat is None or lng is None:
            continue
        records.append(
            {
                "id": school_id,
                "name": google.get("name") or source.get("name") or school_id,
                "lat": lat,
                "lng": lng,
                "address": google.get("address") or source.get("address"),
                "district": source.get("district"),
                "division": source.get("division"),
                "sex": source.get("sex") or None,
                "zone": source.get("zone") or None,
                "medium": source.get("medium") or None,
                "schoolCategory": source.get("school_category") or None,
                "gradeSpan": source.get("grade_span") or None,
                "governmentType": source.get("government_type") or None,
                "totalStudents": source.get("total_students") or None,
                "phone": google.get("phone") or source.get("tel") or None,
                "website": google.get("website") or None,
                "mapUrl": google.get("url") or None,
            }
        )
    records.sort(key=lambda r: (r["district"] or "", r["name"] or ""))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return len(records)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    source_path = args.source.resolve()
    output_path = args.output.resolve()
    cache_path = args.cache.resolve()

    schools = load_schools(source_path)
    print(f"Loaded {len(schools)} schools from {source_path}")
    # Keep the full national listing around for sibling disambiguation
    # (K.V./M.V. pairs, East/West pairs, ...) even when this run is scoped
    # down below with --district/--limit/--school-id/--start.
    all_schools = tuple(schools)

    if args.district:
        schools = [school for school in schools if school.district.casefold() == args.district.casefold()]
        print(f"Filtered to {len(schools)} schools in district={args.district!r}")
    if args.province:
        schools = [school for school in schools if school.province.casefold() == args.province.casefold()]
        print(f"Filtered to {len(schools)} schools in province={args.province!r}")
    if args.school_id:
        schools = [school for school in schools if school.school_id == args.school_id]
        print(f"Filtered to {len(schools)} schools with school_id={args.school_id!r}")

    schools = schools[args.start :]
    if args.limit is not None:
        schools = schools[: args.limit]
    print(f"Selected {len(schools)} schools to include in this run")

    cache = load_cache(cache_path)

    pending: list[SourceSchool] = []
    for school in schools:
        cached = cache.get(school.school_id)
        if cached is not None and not (args.retry_failed and cached.get("status") != "matched"):
            continue
        pending.append(school)
    print(f"{len(schools) - len(pending)} already cached, {len(pending)} to scrape")

    since_save = 0
    # One persistent browser session for the whole run - relaunching a fresh
    # browser per lookup (the previous approach) added ~3-5s of pure startup
    # overhead to every single school.
    with GoogleMapsScraper(headless=args.headless) as scraper:
        scraper.all_schools = all_schools
        for index, school in enumerate(pending, 1):
            print(f"[{index}/{len(pending)}] {school.school_id}: {school.name}")
            try:
                place, score = scraper.find_best_match(school, limit=args.candidates)
            except Exception as exc:  # noqa: BLE001 - one bad lookup must not abort the whole run
                print(f"  ! error: {exc}")
                cache[school.school_id] = build_record(school, None, 0.0, "error")
                since_save += 1
            else:
                if place is None:
                    status = "no-result"
                    print("  -> no result")
                elif score >= MATCH_THRESHOLD:
                    status = "matched"
                    print(f"  -> {place.name} ({score:.2f})")
                else:
                    status = "no-match"
                    print(f"  -> rejected candidate {place.name} ({score:.2f} < {MATCH_THRESHOLD})")
                cache[school.school_id] = build_record(school, place, score, status)
                since_save += 1

            if since_save >= args.save_every:
                save_cache(cache_path, cache)
                since_save = 0

            if args.delay > 0 and index < len(pending):
                time.sleep(args.delay * random.uniform(0.7, 1.3))

    save_cache(cache_path, cache)

    all_records = [cache[school.school_id] for school in schools if school.school_id in cache]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(all_records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    matched = sum(1 for record in all_records if record["status"] == "matched")
    print(f"Wrote {len(all_records)} records to {output_path} ({matched} matched)")
    print(f"Cache: {cache_path}")

    if args.export_catalog:
        catalog_path = args.export_catalog.resolve()
        count = export_catalog(cache, catalog_path)
        print(f"Exported {count} matched schools (full cache) to {catalog_path}")


if __name__ == "__main__":
    main()
