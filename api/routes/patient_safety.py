from flask import Blueprint, jsonify, request

from services.patient_safety import analyze_patient_safety


patient_safety_bp = Blueprint(
    "patient_safety",
    __name__,
)


@patient_safety_bp.route(
    "/patient-safety",
    methods=["POST"],
)
def patient_safety():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required.",
            }), 400


        patient = data.get("patient")
        medicine = data.get("medicine")


        if not isinstance(patient, dict):
            return jsonify({
                "success": False,
                "message": "Patient must be a JSON object.",
            }), 400


        if not isinstance(medicine, dict):
            return jsonify({
                "success": False,
                "message": "Medicine must be a JSON object.",
            }), 400


        if not medicine.get("name"):
            return jsonify({
                "success": False,
                "message": "Medicine name is required.",
            }), 400


        result = analyze_patient_safety(
            patient,
            medicine,
        )


        return jsonify({
            "success": True,
            "data": result,
        })


    except Exception as error:

        print(
            f"Patient safety error: {error}"
        )


        return jsonify({
            "success": False,
            "message": "Failed to analyze patient safety.",
            "error": str(error),
        }), 500