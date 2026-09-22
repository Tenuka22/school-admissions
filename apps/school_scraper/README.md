# school-scraper

Scrapes Google Maps details (coordinates, formatted address, phone, website,
rating) for every government school listed in `data/schools.csv`, using
[Scrapling](https://scrapling.readthedocs.io/en/latest/index.html)'s
`StealthyFetcher` to drive a real browser against Google Maps search, and
writes the merged result to a JSON file.

## Setup

```sh
cd apps/school_scraper
uv sync
uv run scrapling install   # downloads the stealthy browser + fingerprint deps
```

## Usage

```sh
# Smoke test: scrape 3 schools with a visible browser
uv run school-scraper --limit 3 --headed

# Scrape every school in one district
uv run school-scraper --district Galle

# Full run (resumable - safe to Ctrl+C and re-run)
uv run school-scraper

# Re-attempt schools that previously came back no-match/no-result/error
uv run school-scraper --retry-failed
```

Every school is looked up individually with the query
`"{name}, {address}, {division}, {district}, Sri Lanka"`; up to `--candidates`
Maps result cards are opened and the one whose name best matches the CSV row
(`difflib.SequenceMatcher` over a normalized/abbreviation-aware name) is kept.
Results scoring below the match threshold are still cached (so they are never
re-requested) but flagged `no-match` instead of `matched`.

## Output

- `data/schools_map_cache.json` — per-`school_id` cache, written incrementally
  every `--save-every` lookups. This is what makes the scrape resumable: a
  re-run only scrapes `school_id`s missing from the cache (or, with
  `--retry-failed`, ones not previously `matched`).
- `data/schools_map_data.json` — the full snapshot for the schools selected in
  the current run (`--district`/`--school-id`/`--start`/`--limit`), each
  record shaped as:

  ```json
  {
    "school_id": "0114001",
    "census_no": "1",
    "source": { "...": "original CSV row fields" },
    "google": {
      "name": "De La Salle College",
      "address": "...",
      "latitude": 6.xxxx,
      "longitude": 79.xxxx,
      "place_id": "...",
      "url": "https://www.google.com/maps/place/...",
      "phone": "...",
      "website": "...",
      "rating": 4.3,
      "rating_count": 120
    },
    "match_score": 1.0,
    "status": "matched",
    "scraped_at": 1737400000.0
  }
  ```

  `status` is one of `matched`, `no-match`, `no-result`, `error`.

## Notes

- `data/schools.csv` is a copy of
  `aloysius-g1/apps/map-scraper/schools.csv` (10k+ Sri Lankan government
  schools). Refresh it by copying that file over again if the upstream
  listing changes.
- The full CSV is large; a real headless run over every row will take many
  hours. Use `--district`/`--limit`/`--school-id` to scope a run, and rely on
  the cache to resume interrupted scrapes.
