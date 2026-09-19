from flask import Blueprint, jsonify, request


medicine_compare_bp = Blueprint(
    "medicine_compare",
    __name__
)


# ============================================================
# Helpers
# ============================================================

def normalize(value):
    if value is None:
        return ""

    return str(value).strip().lower()


def clean_list(values):
    """
    Remove empty values and duplicates while preserving order.
    """

    if not isinstance(values, list):
        return []

    result = []
    seen = set()

    for value in values:
        if value is None:
            continue

        value = str(value).strip()

        if not value:
            continue

        key = normalize(value)

        if key not in seen:
            seen.add(key)
            result.append(value)

    return result


def compare_lists(list1, list2):
    """
    Compare two medicine lists.
    """

    values1 = clean_list(list1)
    values2 = clean_list(list2)

    map1 = {
        normalize(value): value
        for value in values1
    }

    map2 = {
        normalize(value): value
        for value in values2
    }

    shared = []
    medicine1_only = []
    medicine2_only = []

    # --------------------------------------------------------
    # Shared
    # --------------------------------------------------------

    for key, value in map1.items():
        if key in map2:
            shared.append(value)

    # --------------------------------------------------------
    # Medicine 1 only
    # --------------------------------------------------------

    for key, value in map1.items():
        if key not in map2:
            medicine1_only.append(value)

    # --------------------------------------------------------
    # Medicine 2 only
    # --------------------------------------------------------

    for key, value in map2.items():
        if key not in map1:
            medicine2_only.append(value)

    return {
        "shared": shared,
        "medicine1Only": medicine1_only,
        "medicine2Only": medicine2_only,
    }


def compare_fields(medicine1, medicine2):
    fields = [
        (
            "genericName",
            "Generic Name"
        ),
        (
            "therapeuticClass",
            "Therapeutic Class"
        ),
        (
            "actionClass",
            "Action Class"
        ),
        (
            "chemicalClass",
            "Chemical Class"
        ),
        (
            "habitForming",
            "Habit Forming"
        ),
    ]

    same_fields = []
    different_fields = []

    for field, label in fields:
        value1 = medicine1.get(field)
        value2 = medicine2.get(field)

        if normalize(value1) == normalize(value2):
            same_fields.append({
                "field": field,
                "label": label,
                "value": value1,
            })
        else:
            different_fields.append({
                "field": field,
                "label": label,
                "medicine1": value1,
                "medicine2": value2,
            })

    return {
        "sameFields": same_fields,
        "differentFields": different_fields,
    }


# ============================================================
# POST /api/medicine/compare
# ============================================================

@medicine_compare_bp.route(
    "/medicine/compare",
    methods=["POST"]
)
def compare_medicines():

    try:
        data = request.get_json(
            silent=True
        )

        if not data:
            return jsonify({
                "success": False,
                "message":
                    "Request body is required."
            }), 400

        medicine1 = data.get(
            "medicine1"
        )

        medicine2 = data.get(
            "medicine2"
        )

        # ----------------------------------------------------
        # Validate
        # ----------------------------------------------------

        if not isinstance(
            medicine1,
            dict
        ):
            return jsonify({
                "success": False,
                "message":
                    "medicine1 is required."
            }), 400

        if not isinstance(
            medicine2,
            dict
        ):
            return jsonify({
                "success": False,
                "message":
                    "medicine2 is required."
            }), 400

        if medicine1.get("id") is None:
            return jsonify({
                "success": False,
                "message":
                    "medicine1.id is required."
            }), 400

        if medicine2.get("id") is None:
            return jsonify({
                "success": False,
                "message":
                    "medicine2.id is required."
            }), 400

        if str(medicine1["id"]) == str(
            medicine2["id"]
        ):
            return jsonify({
                "success": False,
                "message":
                    "Please select two different medicines."
            }), 400

        # ----------------------------------------------------
        # Compare properties
        # ----------------------------------------------------

        field_result = compare_fields(
            medicine1,
            medicine2
        )

        # ----------------------------------------------------
        # Compare uses
        # ----------------------------------------------------

        uses_result = compare_lists(
            medicine1.get("uses", []),
            medicine2.get("uses", [])
        )

        # ----------------------------------------------------
        # Compare side effects
        # ----------------------------------------------------

        side_effects_result = compare_lists(
            medicine1.get(
                "sideEffects",
                []
            ),
            medicine2.get(
                "sideEffects",
                []
            )
        )

        # ----------------------------------------------------
        # Final result
        # ----------------------------------------------------

        result = {
            "medicine1": medicine1,
            "medicine2": medicine2,

            "sameFields":
                field_result["sameFields"],

            "differentFields":
                field_result["differentFields"],

            "uses": uses_result,

            "sideEffects":
                side_effects_result,
        }

        return jsonify({
            "success": True,
            "data": result,
        }), 200

    except Exception as error:

        print(
            "Medicine comparison error:",
            str(error)
        )

        return jsonify({
            "success": False,
            "message":
                "Failed to compare medicines."
        }), 500