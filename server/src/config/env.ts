import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
});

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Configure it in server/.env using server/.env.example.`,
    );
  }
  return value;
};

const databasePort = Number(process.env.DB_PORT || "5432");
if (!Number.isInteger(databasePort) || databasePort < 1 || databasePort > 65535) {
  throw new Error("DB_PORT must be a valid TCP port between 1 and 65535.");
}

export const env = {
  port: Number(process.env.PORT) || 5000,

  database: {
    host: required("DB_HOST"),
    port: databasePort,
    name: required("DB_NAME"),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
  },

  flaskUrl:
    process.env.FLASK_URL ||
    "http://127.0.0.1:5001",

  geminiApiKey: process.env.gemini_api_key?.trim() || null,
  geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite",

  jwtSecret:
    process.env.JWT_SECRET ||
    "development-secret",
};