from flask import Flask
from flask_cors import CORS

from routes.health import health_bp
from routes.prediction import prediction_bp
from routes.alternatives import alternatives_bp
from routes.patient_safety import patient_safety_bp
from routes.medicine_compare import medicine_compare_bp


def create_app():
    app = Flask(__name__)

    # ==================================================
    # CORS
    # ==================================================

    CORS(app)

    # ==================================================
    # HEALTH
    # ==================================================

    app.register_blueprint(
        health_bp,
        url_prefix="/api",
    )

    # ==================================================
    # ADR PREDICTION
    # ==================================================

    app.register_blueprint(
        prediction_bp,
        url_prefix="/api",
    )

    # ==================================================
    # ALTERNATIVES
    # ==================================================

    app.register_blueprint(
        alternatives_bp,
        url_prefix="/api",
    )

    # ==================================================
    # PATIENT SAFETY
    # ==================================================

    app.register_blueprint(
        patient_safety_bp,
        url_prefix="/api",
    )

    # ==================================================
    # MEDICINE COMPARISON
    # ==================================================

    app.register_blueprint(
        medicine_compare_bp,
        url_prefix="/api",
    )

    return app


# ==================================================
# Create application
# ==================================================

app = create_app()


# ==================================================
# Run Flask
# ==================================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True,
    )