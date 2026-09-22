from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass(frozen=True)
class SourceSchool:
    """A single row from the government school listing CSV."""

    seq_no: int
    school_id: str
    census_no: str
    name: str
    address: str
    tel: str
    email: str
    province: str
    district: str
    zone: str
    division: str
    medium: str
    sex: str
    government_type: str
    school_category: str
    grade_span: str
    difficulty: str
    total_students: int

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class MapPlace:
    """A Google Maps place result for a school lookup."""

    name: str
    address: str | None
    latitude: float | None
    longitude: float | None
    place_id: str | None
    url: str | None
    category: str | None = None
    phone: str | None = None
    website: str | None = None
    rating: float | None = None
    rating_count: int | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
