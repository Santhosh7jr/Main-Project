from flask import Blueprint, jsonify, request

from services.alternative_service import (
    find_alternatives
)


alternatives_bp = Blueprint(
    "alternatives",
    __name__
)


@alternatives_bp.route(
    "/alternatives",
    methods=["POST"]
)
def alternatives():

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required."
            }), 400

        medicine = data.get("medicine")
        medicines = data.get("medicines")

        if not medicine:
            return jsonify({
                "success": False,
                "message": "Medicine information is required."
            }), 400

        if not isinstance(medicine, dict):
            return jsonify({
                "success": False,
                "message": "Medicine must be a JSON object."
            }), 400

        if medicines is None:
            return jsonify({
                "success": False,
                "message": "Medicines list is required."
            }), 400

        if not isinstance(medicines, list):
            return jsonify({
                "success": False,
                "message": "Medicines must be an array."
            }), 400

        results = find_alternatives(
            medicine=medicine,
            medicines=medicines,
            limit=5
        )

        return jsonify({
            "success": True,
            "data": results
        })

    except Exception as error:

        print(
            f"Alternative prediction error: {error}"
        )

        return jsonify({
            "success": False,
            "message": (
                "Failed to find alternative medicines."
            ),
            "error": str(error)
        }), 500