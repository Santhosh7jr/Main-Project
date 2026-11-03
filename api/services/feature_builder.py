"""Shared text normalization for ADR model training and inference."""
import re


def clean_text(value):
    if value is None:
        return ""
    text = re.sub(r"\s+", " ", str(value)).strip().lower()
    return "" if text in {"nan", "none", "null", "n/a", "na"} else text


def _habit_forming(value):
    if isinstance(value, bool):
        return "yes" if value else "no"
    normalized = clean_text(value)
    if normalized in {"true", "1", "yes", "y"}:
        return "yes"
    if normalized in {"false", "0", "no", "n"}:
        return "no"
    return normalized


def build_medicine_text(medicine):
    """Build model text in the same fixed field order for train and serve."""
    parts = []
    name = clean_text(medicine.get("name", ""))
    if name:
        parts.append(name)

    uses = medicine.get("uses", [])
    if not isinstance(uses, (list, tuple)):
        uses = [uses] if uses else []
    for use in uses[:5]:
        value = clean_text(use)
        if value:
            parts.append(value)

    for field in ("therapeuticClass", "actionClass", "chemicalClass"):
        value = clean_text(medicine.get(field, ""))
        if value:
            parts.append(value)

    habit = _habit_forming(medicine.get("habitForming", ""))
    if habit:
        parts.append(habit)

    return " ".join(parts)


def normalize_medicine_name(value):
    return re.sub(r"[^a-z0-9]+", " ", clean_text(value)).strip()
