import logging

from flask import Blueprint, jsonify, request

from services.predictor import ModelUnavailableError, predictor


prediction_bp = Blueprint(
    "prediction",
    __name__
)
logger = logging.getLogger(__name__)


@prediction_bp.route(
    "/model-info",
    methods=["GET"]
)
def model_info():
    try:
        return jsonify({
            "success": True,
            **predictor.model_info(),
        })
    except ModelUnavailableError as error:
        return jsonify({
            "success": False,
            "modelReady": False,
            "message": str(error),
        }), 503


@prediction_bp.route(
    "/predict",
    methods=["POST"]
)
def predict():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A JSON request body is required.",
        }), 400

    medicine = data.get("medicine")
    if not isinstance(medicine, dict):
        return jsonify({
            "success": False,
            "message": "Medicine must be a JSON object.",
        }), 400

    name = medicine.get("name")
    if not isinstance(name, str) or not name.strip():
        return jsonify({
            "success": False,
            "message": "A non-empty medicine name is required.",
        }), 400

    uses = medicine.get("uses", [])
    if uses is not None and (
        not isinstance(uses, list)
        or any(not isinstance(use, str) for use in uses)
    ):
        return jsonify({
            "success": False,
            "message": "Medicine uses must be an array of strings.",
        }), 400
    for field in ("therapeuticClass", "actionClass", "chemicalClass"):
        value = medicine.get(field)
        if value is not None and not isinstance(value, str):
            return jsonify({
                "success": False,
                "message": f"{field} must be a string or null.",
            }), 400
    habit_forming = medicine.get("habitForming")
    if habit_forming is not None and not isinstance(habit_forming, (bool, str, int)):
        return jsonify({
            "success": False,
            "message": "habitForming must be a boolean, string, or null.",
        }), 400

    try:
        return jsonify({
            "success": True,
            "data": predictor.predict(medicine),
        })
    except ModelUnavailableError as error:
        return jsonify({
            "success": False,
            "message": str(error),
        }), 503
    except Exception:
        logger.exception("ADR prediction failed")
        return jsonify({
            "success": False,
            "message": "Failed to generate ADR prediction.",
        }), 500