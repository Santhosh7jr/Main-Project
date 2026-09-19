import math


def calculate_similarity(
    medicine,
    candidate
):
    """
    Calculate a simple metadata-based similarity
    between the selected medicine and a candidate.

    This is NOT a clinical equivalence score.
    It is only used to identify potentially similar
    medicines for clinician review.
    """

    score = 0.0
    reasons = []

    # ---------------------------------------------
    # Therapeutic class
    # ---------------------------------------------

    therapeutic_a = (
        medicine.get("therapeuticClass")
        or ""
    ).strip().lower()

    therapeutic_b = (
        candidate.get("therapeuticClass")
        or ""
    ).strip().lower()

    if (
        therapeutic_a
        and therapeutic_b
        and therapeutic_a == therapeutic_b
    ):
        score += 0.35
        reasons.append(
            "Same therapeutic class"
        )

    # ---------------------------------------------
    # Action class
    # ---------------------------------------------

    action_a = (
        medicine.get("actionClass")
        or ""
    ).strip().lower()

    action_b = (
        candidate.get("actionClass")
        or ""
    ).strip().lower()

    if (
        action_a
        and action_b
        and action_a == action_b
    ):
        score += 0.30
        reasons.append(
            "Same action class"
        )

    # ---------------------------------------------
    # Chemical class
    # ---------------------------------------------

    chemical_a = (
        medicine.get("chemicalClass")
        or ""
    ).strip().lower()

    chemical_b = (
        candidate.get("chemicalClass")
        or ""
    ).strip().lower()

    if (
        chemical_a
        and chemical_b
        and chemical_a == chemical_b
    ):
        score += 0.15
        reasons.append(
            "Same chemical class"
        )

    # ---------------------------------------------
    # Uses
    # ---------------------------------------------

    uses_a = {
        str(use).strip().lower()
        for use in medicine.get(
            "uses",
            []
        )
        if use
    }

    uses_b = {
        str(use).strip().lower()
        for use in candidate.get(
            "uses",
            []
        )
        if use
    }

    if uses_a and uses_b:

        intersection = (
            uses_a.intersection(
                uses_b
            )
        )

        union = (
            uses_a.union(
                uses_b
            )
        )

        if union:

            jaccard = (
                len(intersection)
                / len(union)
            )

            use_score = (
                jaccard * 0.20
            )

            score += use_score

            if intersection:
                reasons.append(
                    "Shared medical uses"
                )

    # ---------------------------------------------
    # Convert to percentage-like value
    # ---------------------------------------------

    score = min(
        max(score, 0.0),
        1.0
    )

    if reasons:
        reason = ", ".join(
            reasons
        )
    else:
        reason = (
            "Limited metadata similarity"
        )

    return {
        "score": round(
            score,
            4
        ),
        "reason": reason
    }


def find_alternatives(
    medicine,
    medicines,
    limit=5
):
    """
    Find the most similar medicines.

    The selected medicine itself is excluded.
    """

    results = []

    selected_name = (
        medicine.get("name")
        or ""
    ).strip().lower()

    for candidate in medicines:

        candidate_name = (
            candidate.get("name")
            or ""
        ).strip().lower()

        # Don't recommend the same medicine
        if (
            candidate_name
            == selected_name
        ):
            continue

        similarity = calculate_similarity(
            medicine,
            candidate
        )

        # Ignore candidates with
        # absolutely no similarity
        if similarity["score"] <= 0:
            continue

        results.append({
            "medicine": candidate,
            "similarity": similarity["score"],
            "reason": similarity["reason"]
        })

    results.sort(
        key=lambda item:
            item["similarity"],
        reverse=True
    )

    return results[:limit]