from difflib import SequenceMatcher
import re


def _clean(value):
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def _tokens(value):
    return {
        token
        for token in re.findall(r"[a-z0-9]+", _clean(value))
        if len(token) > 1
    }


def _text_similarity(a, b):
    a = _clean(a)
    b = _clean(b)
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def _set_similarity(a, b):
    a = {_clean(x) for x in a if _clean(x)}
    b = {_clean(x) for x in b if _clean(x)}
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _use_similarity(uses_a, uses_b):
    """Combines exact-use overlap with wording similarity between uses."""
    a = [_clean(x) for x in uses_a if _clean(x)]
    b = [_clean(x) for x in uses_b if _clean(x)]
    if not a or not b:
        return 0.0

    exact = _set_similarity(a, b)
    pair_scores = [
        max(_text_similarity(use_a, use_b) for use_b in b)
        for use_a in a
    ]
    wording = sum(pair_scores) / len(pair_scores) if pair_scores else 0.0
    return (exact * 0.65) + (wording * 0.35)


def calculate_similarity(medicine, candidate):
    """
    Metadata similarity for finding medicines worth clinician review.

    This is NOT a clinical-equivalence score and must not be interpreted
    as evidence that two medicines can be substituted for one another.
    """
    score = 0.0
    reasons = []

    therapeutic_a = _clean(medicine.get("therapeuticClass"))
    therapeutic_b = _clean(candidate.get("therapeuticClass"))
    action_a = _clean(medicine.get("actionClass"))
    action_b = _clean(candidate.get("actionClass"))
    chemical_a = _clean(medicine.get("chemicalClass"))
    chemical_b = _clean(candidate.get("chemicalClass"))

    # Class matches provide the broadest signal.
    if therapeutic_a and therapeutic_a == therapeutic_b:
        score += 0.20
        reasons.append("Same therapeutic class")

    if action_a and action_a == action_b:
        score += 0.15
        reasons.append("Same action class")

    if chemical_a and chemical_a == chemical_b:
        score += 0.10
        reasons.append("Same chemical class")

    uses_a = medicine.get("uses") or []
    uses_b = candidate.get("uses") or []
    use_score = _use_similarity(uses_a, uses_b)
    score += use_score * 0.30
    if use_score >= 0.15:
        reasons.append("Similar medical uses")

    # Use wording adds variation even when the database uses are not exact matches.
    use_text_a = " | ".join(sorted(_clean(x) for x in uses_a if _clean(x)))
    use_text_b = " | ".join(sorted(_clean(x) for x in uses_b if _clean(x)))
    use_wording = _text_similarity(use_text_a, use_text_b)
    score += use_wording * 0.10

    # Generic-name similarity helps distinguish candidates that share classes
    # but are not equally close in the underlying medicine metadata.
    generic_similarity = _text_similarity(
        medicine.get("genericName"),
        candidate.get("genericName"),
    )
    score += generic_similarity * 0.10
    if generic_similarity >= 0.55:
        reasons.append("Related generic-name information")

    # A small token-level signal from the medicine names themselves.
    name_tokens_a = _tokens(medicine.get("name"))
    name_tokens_b = _tokens(candidate.get("name"))
    if name_tokens_a and name_tokens_b:
        name_overlap = len(name_tokens_a & name_tokens_b) / len(name_tokens_a | name_tokens_b)
        score += name_overlap * 0.05
        if name_overlap > 0:
            reasons.append("Related medicine naming")

    score = max(0.0, min(score, 0.99))

    if not reasons:
        reason = "Limited metadata similarity"
    else:
        reason = ", ".join(dict.fromkeys(reasons))

    if score >= 0.75:
        match_level = "Strong match"
    elif score >= 0.50:
        match_level = "Good match"
    elif score >= 0.30:
        match_level = "Moderate match"
    else:
        match_level = "Possible match"

    return {
        "score": round(score, 4),
        "reason": reason,
        "matchLevel": match_level,
    }


def find_alternatives(medicine, medicines, limit=5):
    results = []
    selected_id = medicine.get("id")
    selected_name = _clean(medicine.get("name"))

    for candidate in medicines:
        if candidate.get("id") == selected_id:
            continue

        candidate_name = _clean(candidate.get("name"))
        if candidate_name == selected_name:
            continue

        similarity = calculate_similarity(medicine, candidate)
        if similarity["score"] <= 0:
            continue

        results.append({
            "medicine": candidate,
            "similarity": similarity["score"],
            "reason": similarity["reason"],
            "matchLevel": similarity["matchLevel"],
        })

    results.sort(
        key=lambda item: (
            item["similarity"],
            item["medicine"].get("id", 0),
        ),
        reverse=True,
    )

    return results[:limit]
