from flask import Blueprint, jsonify, request

from services.predictor import predictor


prediction_bp = Blueprint(
    "prediction",
    __name__
)


@prediction_bp.route(
    "/model-info",
    methods=["GET"]
)
def model_info():
    return jsonify({
        "success": True,
        "modelType": predictor.model_type,
        "threshold": predictor.threshold,
        "numberOfClasses": len(
            predictor.classes
        )
    })


@prediction_bp.route(
    "/predict",
    methods=["POST"]
)
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required."
            }), 400

        medicine = data.get("medicine")

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

        if not medicine.get("name"):
            return jsonify({
                "success": False,
                "message": "Medicine name is required."
            }), 400

        result = predictor.predict(
            medicine
        )

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as error:
        print(
            f"Prediction error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to generate ADR prediction.",
            "error": str(error)
        }), 500