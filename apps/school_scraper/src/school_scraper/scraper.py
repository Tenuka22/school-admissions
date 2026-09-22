from __future__ import annotations

import re
import time
from typing import Any, Iterable
from urllib.parse import quote

from scrapling.fetchers import StealthyFetcher

from .match_logic import accept, location_hints as build_location_hints
from .models import MapPlace, SourceSchool
from .csv_loader import is_primary_school

MAPS_URL = "https://www.google.com/maps"
CARD_SELECTOR = "div.Nv2PK"
CARD_NAME_SELECTORS = ("div.qBF1Pd", "[role=heading]")
MODAL_NAME_SELECTORS = ("h1.DUwDvf.lfPIob", "h1")
MODAL_ADDRESS_SELECTOR = 'button[data-item-id="address"] .Io6YTe'
MODAL_CATEGORY_SELECTOR = 'button[jsaction$=".category"]'
MODAL_PHONE_SELECTOR = 'button[data-item-id^="phone:tel:"] .Io6YTe'
MODAL_WEBSITE_SELECTOR = 'a[data-item-id="authority"]'
MODAL_RATING_SELECTOR = "div.F7nice span[aria-hidden='true']"
MODAL_RATING_COUNT_SELECTOR = "div.F7nice span[aria-label*='review']"
FEED_SELECTORS = ('div[role="feed"]', ".m6QErb.DxyBCb", ".m6QErb")

# Google Maps' category label for the place (e.g. "Government school",
# "Primary school", "College", but also "Book store", "Restaurant", ...). A
# candidate whose category is present but does not look educational is
# rejected outright, regardless of name similarity - this is what stops e.g.
# "KUMARA V." from matching "Kumara Book Shop" (category "Book store") just
# because the names share a token.
EDU_CATEGORY_KEYWORDS = (
    "school",
    "college",
    "vidyalaya",
    "vidyalayam",
    "academy",
    "institute",
    "institution",
    "educational",
    "university",
    "kindergarten",
    "pre-school",
    "preschool",
    "madrasa",
    "seminary",
    "campus",
)


def extract_coordinates_from_url(url: str) -> tuple[float | None, float | None]:
    """Extract a place's coordinates, preferring the place pin over viewport data."""
    if not url:
        return None, None
    patterns = (
        r"!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)",
        r"@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)",
        r"ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)",
    )
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return float(match.group(1)), float(match.group(2))
    return None, None


def _normalise_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()


def is_educational_category(category: str | None) -> bool:
    """True unless Maps returned a category that clearly rules out a school.

    No category extracted (selector missed) -> treated as unknown, not
    disqualifying, since name/address scoring already has to carry the match.
    """
    if not category:
        return True
    lowered = category.casefold()
    return any(keyword in lowered for keyword in EDU_CATEGORY_KEYWORDS)


class GoogleMapsScraper:
    """Search Google Maps for a school and extract the best-matching place card."""

    def __init__(self, *, headless: bool = True, timeout_ms: int = 45_000):
        self.headless = headless
        self.timeout_ms = timeout_ms
        # The FULL national listing (not just the rows selected for this
        # run), so sibling disambiguation (same-division K.V./M.V. pairs,
        # East/West pairs, ...) always sees every real sibling even when a
        # run is scoped with --district/--limit/--school-id.
        self.all_schools: tuple[SourceSchool, ...] = ()

    def __enter__(self) -> "GoogleMapsScraper":
        return self

    def __exit__(self, *exc_info: object) -> None:
        pass

    @staticmethod
    def _first_locator(page: Any, selectors: Iterable[str]) -> Any | None:
        for selector in selectors:
            locator = page.locator(selector).first
            try:
                if locator.count() > 0:
                    return locator
            except Exception:
                continue
        return None

    @classmethod
    def _text(cls, page: Any, selectors: Iterable[str], timeout_ms: int = 2_000) -> str | None:
        locator = cls._first_locator(page, selectors)
        if locator is None:
            return None
        try:
            value = locator.inner_text(timeout=timeout_ms)
            return value.strip() if value else None
        except Exception:
            return None

    @classmethod
    def _attr(cls, page: Any, selectors: Iterable[str], attribute: str, timeout_ms: int = 1_500) -> str | None:
        locator = cls._first_locator(page, selectors)
        if locator is None:
            return None
        try:
            value = locator.get_attribute(attribute, timeout=timeout_ms)
            return value.strip() if value else None
        except Exception:
            return None

    @classmethod
    def _extract_modal(cls, page: Any) -> MapPlace | None:
        try:
            page.wait_for_selector(MODAL_NAME_SELECTORS[0], timeout=5_000)
        except Exception:
            pass
        name = cls._text(page, (MODAL_NAME_SELECTORS[0],), timeout_ms=3_000)
        if not name and "/maps/place/" in page.url:
            name = cls._text(page, ("h1",), timeout_ms=1_000)
        if not name:
            return None

        latitude, longitude = extract_coordinates_from_url(page.url)
        address = cls._text(page, (MODAL_ADDRESS_SELECTOR,), timeout_ms=1_000)
        category = cls._text(page, (MODAL_CATEGORY_SELECTOR,), timeout_ms=1_000)
        phone = cls._text(page, (MODAL_PHONE_SELECTOR,), timeout_ms=1_000)
        website = cls._attr(page, (MODAL_WEBSITE_SELECTOR,), "href", timeout_ms=1_000)

        rating_text = cls._text(page, (MODAL_RATING_SELECTOR,), timeout_ms=1_000)
        rating: float | None = None
        if rating_text:
            try:
                rating = float(rating_text.replace(",", "."))
            except ValueError:
                rating = None

        rating_count_text = cls._text(page, (MODAL_RATING_COUNT_SELECTOR,), timeout_ms=1_000)
        rating_count: int | None = None
        if rating_count_text:
            digits = re.sub(r"[^0-9]", "", rating_count_text)
            rating_count = int(digits) if digits else None

        place_id_match = re.search(r"!1s([^!]+)", page.url)
        return MapPlace(
            name=name,
            address=address,
            latitude=latitude,
            longitude=longitude,
            place_id=place_id_match.group(1) if place_id_match else None,
            url=page.url,
            category=category,
            phone=phone,
            website=website,
            rating=rating,
            rating_count=rating_count,
        )

    @staticmethod
    def _scroll_feed(page: Any) -> None:
        for selector in FEED_SELECTORS:
            try:
                if page.locator(selector).first.count() > 0:
                    page.evaluate(
                        """(selector) => {
                            const feed = document.querySelector(selector);
                            if (feed) feed.scrollTop += 1200;
                        }""",
                        selector,
                    )
                    time.sleep(0.8)
                    return
            except Exception:
                continue

    def search(self, query: str, *, limit: int = 3) -> list[MapPlace]:
        """Search Google Maps and extract up to `limit` place cards' details."""
        results: list[MapPlace] = []
        maps_url = f"{MAPS_URL}/search/{quote(query)}"

        def workflow(page: Any) -> Any:
            page.wait_for_timeout(4_000)
            if "/maps/place/" in page.url:
                place = self._extract_modal(page)
                if place is not None:
                    results.append(place)
                return page

            links: list[tuple[str, str]] = []
            seen_names: set[str] = set()
            idle_rounds = 0
            deadline = time.monotonic() + self.timeout_ms / 1_000
            while time.monotonic() < deadline and len(links) < limit:
                cards = page.locator(CARD_SELECTOR)
                card_count = cards.count()
                if card_count == 0:
                    self._scroll_feed(page)
                    page.wait_for_timeout(1_200)
                    idle_rounds += 1
                    if idle_rounds >= 4:
                        break
                    continue

                new_cards = 0
                for index in range(card_count):
                    if len(links) >= limit:
                        break
                    card = cards.nth(index)
                    card_name = self._text(card, CARD_NAME_SELECTORS, timeout_ms=750)
                    if not card_name or _normalise_name(card_name) in seen_names:
                        continue
                    link = card.locator("a").first
                    try:
                        href = link.get_attribute("href") if link.count() > 0 else None
                    except Exception:
                        href = None
                    if not href:
                        continue
                    links.append((card_name, href))
                    seen_names.add(_normalise_name(card_name))
                    new_cards += 1

                if len(links) >= limit:
                    break
                idle_rounds = idle_rounds + 1 if new_cards == 0 else 0
                if idle_rounds >= 4:
                    break
                self._scroll_feed(page)
                page.wait_for_timeout(1_200)

            for card_name, href in links:
                try:
                    page.goto(href, timeout=min(self.timeout_ms, 30_000))
                    page.wait_for_timeout(1_000)
                    place = self._extract_modal(page)
                    if place is not None:
                        results.append(place)
                except Exception:
                    continue
            return page

        # A fresh browser launch per lookup (rather than a reused persistent
        # session/tab) is deliberate: a reused Maps tab's client-side
        # navigation between searches intermittently fails to settle before
        # extraction runs, silently turning good matches into false
        # "no-result"s. For a scrape whose entire point is correctness, that
        # trade is not worth the ~30-40% speedup a shared session would give.
        StealthyFetcher.fetch(
            maps_url,
            headless=self.headless,
            network_idle=False,
            page_action=workflow,
            google_search=False,
            timeout=self.timeout_ms,
        )
        return results

    def find_best_match(self, school: SourceSchool, *, limit: int = 3) -> tuple[MapPlace | None, float]:
        """Search Google Maps for a school and return its best-scoring, accepted candidate.

        Candidates whose category is present but clearly non-educational
        (shops, restaurants, ...) are dropped before ranking so a shared name
        token can never outrank a genuine category mismatch. Survivors are
        then scored with the school-aware ``accept()`` matcher (name-type
        families, village-only labels, direction conflicts, sibling
        disambiguation, address corroboration) rather than bare name
        similarity, so e.g. a bare village-label card or a sibling K.V./M.V.
        pair can't slip through on a high fuzzy score alone.
        """
        query = f"{school.name}, {school.address}, {school.division}, {school.district}, Sri Lanka"
        candidates = [c for c in self.search(query, limit=limit) if is_educational_category(c.category)]
        if not candidates:
            return None, 0.0

        hints = build_location_hints(school.address, school.division, school.name)
        siblings = tuple(
            other.name
            for other in self.all_schools
            if other.division == school.division and other.school_id != school.school_id
        )
        judged = [
            (candidate, *accept(
                school.name,
                candidate.name,
                source_is_primary=is_primary_school(school),
                result_address=candidate.address,
                location_hints=hints,
                sibling_names=siblings,
            ))
            for candidate in candidates
        ]
        accepted = [(candidate, score) for candidate, ok, score in judged if ok]
        if accepted:
            return max(accepted, key=lambda item: item[1])
        # Nothing passed the school-aware gate; still report the best raw
        # score so the caller can record a "no-match" (not "no-result").
        _, _, best_score = max(judged, key=lambda item: item[2])
        return None, best_score
