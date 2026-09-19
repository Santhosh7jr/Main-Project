import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,

  flaskUrl:
    process.env.FLASK_URL ||
    "http://127.0.0.1:5001",

  jwtSecret:
    process.env.JWT_SECRET ||
    "development-secret",
};