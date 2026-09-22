from __future__ import annotations

import csv
from pathlib import Path

from .models import SourceSchool


def _int(value: str | None) -> int:
    if not value:
        return 0
    try:
        return int(value.strip())
    except ValueError:
        return 0


def load_schools(path: Path) -> list[SourceSchool]:
    """Load the government school listing CSV into `SourceSchool` rows.

    Columns: seq_no,school_id,census_no,name,address,tel,email,province,
    district,zone,division,medium,sex,government_type,school_category,
    grade_span,difficulty,total_students
    """
    schools: list[SourceSchool] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            name = (row.get("name") or "").strip()
            if not name:
                continue
            schools.append(
                SourceSchool(
                    seq_no=_int(row.get("seq_no")),
                    school_id=(row.get("school_id") or "").strip(),
                    census_no=(row.get("census_no") or "").strip(),
                    name=name,
                    address=(row.get("address") or "").strip(),
                    tel=(row.get("tel") or "").strip(),
                    email=(row.get("email") or "").strip(),
                    province=(row.get("province") or "").strip(),
                    district=(row.get("district") or "").strip(),
                    zone=(row.get("zone") or "").strip(),
                    division=(row.get("division") or "").strip(),
                    medium=(row.get("medium") or "").strip(),
                    sex=(row.get("sex") or "").strip(),
                    government_type=(row.get("government_type") or "").strip(),
                    school_category=(row.get("school_category") or "").strip(),
                    grade_span=(row.get("grade_span") or "").strip(),
                    difficulty=(row.get("difficulty") or "").strip(),
                    total_students=_int(row.get("total_students")),
                )
            )
    return schools


def is_primary_school(school: SourceSchool) -> bool:
    """Whether the listing's grade span marks this as a primary-only school.

    Some rows carry no primary marker in their name yet Google correctly
    lists them as "... Primary School". The grade span is authoritative.
    """
    span = school.grade_span.casefold().replace(" ", "")
    return span in {"grade1-5", "grade1-4", "grade1", "grade01-05"}
