from flask import Blueprint


health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    return {
        "success": True,
        "message": "MedGuard Flask ML API is running"
    }