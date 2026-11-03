import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import pool from "../config/database.js";
import { env } from "../config/env.js";

import type {
  RegisterDoctorInput,
  LoginDoctorInput,
  Doctor,
  JwtPayload,
} from "../types/auth.js";

const JWT_SECRET = env.jwtSecret;

// ======================================================
// REGISTER DOCTOR
// ======================================================

export const registerDoctor = async ({
  name,
  email,
  password,
  specialization,
}: RegisterDoctorInput): Promise<Doctor> => {

  // ----------------------------------------------------
  // Validate input
  // ----------------------------------------------------

  if (!name || !name.trim()) {
    throw new Error("Doctor name is required");
  }

  if (!email || !email.trim()) {
    throw new Error("Email is required");
  }

  if (!password || password.length < 6) {
    throw new Error("Password must contain at least 6 characters");
  }

  if (!specialization || !specialization.trim()) {
    throw new Error("Specialization is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // ----------------------------------------------------
  // Check whether doctor already exists
  // ----------------------------------------------------

  const existingDoctor = await pool.query(
    `
    SELECT id
    FROM doctors
    WHERE email = $1
    `,
    [normalizedEmail]
  );

  if (existingDoctor.rows.length > 0) {
    throw new Error("A doctor with this email already exists");
  }

  // ----------------------------------------------------
  // Hash password
  // ----------------------------------------------------

  const passwordHash = await bcrypt.hash(password, 12);

  // ----------------------------------------------------
  // Insert doctor
  // ----------------------------------------------------

  const result = await pool.query(
    `
    INSERT INTO doctors (
      name,
      email,
      password_hash,
      specialization
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      name,
      email,
      specialization
    `,
    [
      name.trim(),
      normalizedEmail,
      passwordHash,
      specialization.trim(),
    ]
  );

  return result.rows[0];
};

// ======================================================
// LOGIN DOCTOR
// ======================================================

export const loginDoctor = async ({
  email,
  password,
}: LoginDoctorInput) => {

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // ----------------------------------------------------
  // Find doctor
  // ----------------------------------------------------

  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      password_hash,
      specialization
    FROM doctors
    WHERE email = $1
    `,
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }

  const doctor = result.rows[0];

  // ----------------------------------------------------
  // Compare password
  // ----------------------------------------------------

  const passwordMatches = await bcrypt.compare(
    password,
    doctor.password_hash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  // ----------------------------------------------------
  // Create JWT
  // ----------------------------------------------------

  const payload: JwtPayload = {
    doctorId: doctor.id,
    email: doctor.email,
  };

  const token = jwt.sign(
    payload,
    JWT_SECRET as string,
    {
      expiresIn: "7d",
    }
  );

  // ----------------------------------------------------
  // Return doctor + token
  // ----------------------------------------------------

  return {
    token,

    doctor: {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
    },
  };
};

// ======================================================
// VERIFY JWT
// ======================================================

export const verifyToken = (
  token: string
): JwtPayload => {

  return jwt.verify(
    token,
    JWT_SECRET as string
  ) as JwtPayload;
};
