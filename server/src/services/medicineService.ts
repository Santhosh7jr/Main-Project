import pool from "../config/database.js";

import type {
  Medicine,
} from "../types/medicine.js";

// ============================================================
// Search medicines
// ============================================================

export const searchMedicines = async (
  search: string
): Promise<Medicine[]> => {
  const query = search.trim();

  if (!query) {
    return [];
  }

  const searchPattern = `%${query}%`;

  const medicineResult = await pool.query(
    `
      SELECT
        id,
        name,
        generic_name AS "genericName",
        therapeutic_class AS "therapeuticClass",
        action_class AS "actionClass",
        chemical_class AS "chemicalClass",
        habit_forming AS "habitForming"
      FROM medicines
      WHERE
        name ILIKE $1
        OR generic_name ILIKE $1
      ORDER BY
        CASE
          WHEN LOWER(name) = LOWER($2) THEN 0
          WHEN LOWER(name) LIKE LOWER($2) || '%' THEN 1
          WHEN LOWER(generic_name) = LOWER($2) THEN 2
          WHEN LOWER(generic_name) LIKE LOWER($2) || '%' THEN 3
          ELSE 4
        END,
        name
      LIMIT 20
    `,
    [searchPattern, query]
  );

  if (medicineResult.rows.length === 0) {
    return [];
  }

  const medicineIds = medicineResult.rows.map(
    (medicine) => medicine.id
  );

  const usesResult = await pool.query(
    `
      SELECT
        medicine_id,
        use_name
      FROM medicine_uses
      WHERE medicine_id = ANY($1::int[])
      ORDER BY medicine_id, id
    `,
    [medicineIds]
  );

  const usesMap = new Map<number, string[]>();

  for (const row of usesResult.rows) {
    if (!usesMap.has(row.medicine_id)) {
      usesMap.set(row.medicine_id, []);
    }

    if (row.use_name) {
      usesMap.get(row.medicine_id)!.push(row.use_name);
    }
  }

  return medicineResult.rows.map((medicine) => ({
    ...medicine,
    uses: usesMap.get(medicine.id) ?? [],
    sideEffects: [],
  }));
};

// ============================================================
// Get medicine by ID
// ============================================================

export const getMedicineById = async (
  medicineId: number
): Promise<Medicine | null> => {
  const medicineResult = await pool.query(
    `
      SELECT
        id,
        name,
        generic_name AS "genericName",
        therapeutic_class AS "therapeuticClass",
        action_class AS "actionClass",
        chemical_class AS "chemicalClass",
        habit_forming AS "habitForming"
      FROM medicines
      WHERE id = $1
      LIMIT 1
    `,
    [medicineId]
  );

  if (medicineResult.rows.length === 0) {
    return null;
  }

  const medicine = medicineResult.rows[0];

  // ----------------------------------------------------------
  // Uses
  // ----------------------------------------------------------

  const usesResult = await pool.query(
    `
      SELECT
        use_name
      FROM medicine_uses
      WHERE medicine_id = $1
      ORDER BY id
    `,
    [medicineId]
  );

  // ----------------------------------------------------------
  // Side effects
  // ----------------------------------------------------------

  const sideEffectsResult = await pool.query(
    `
      SELECT
        side_effect_name
      FROM medicine_side_effects
      WHERE medicine_id = $1
      ORDER BY id
    `,
    [medicineId]
  );

  return {
    ...medicine,

    uses: usesResult.rows
      .map((row) => row.use_name)
      .filter(Boolean),

    sideEffects: sideEffectsResult.rows
      .map((row) => row.side_effect_name)
      .filter(Boolean),
  };
};

// ============================================================
// Get two medicines for comparison
// ============================================================

export const getMedicinesForComparison = async (
  medicine1Id: number,
  medicine2Id: number
): Promise<{
  medicine1: Medicine;
  medicine2: Medicine;
} | null> => {
  const medicineResult = await pool.query(
    `
      SELECT
        id,
        name,
        generic_name AS "genericName",
        therapeutic_class AS "therapeuticClass",
        action_class AS "actionClass",
        chemical_class AS "chemicalClass",
        habit_forming AS "habitForming"
      FROM medicines
      WHERE id = ANY($1::int[])
    `,
    [[medicine1Id, medicine2Id]]
  );

  if (medicineResult.rows.length !== 2) {
    return null;
  }

  // ----------------------------------------------------------
  // Uses
  // ----------------------------------------------------------

  const usesResult = await pool.query(
    `
      SELECT
        medicine_id,
        use_name
      FROM medicine_uses
      WHERE medicine_id = ANY($1::int[])
      ORDER BY medicine_id, id
    `,
    [[medicine1Id, medicine2Id]]
  );

  // ----------------------------------------------------------
  // Side effects
  // ----------------------------------------------------------

  const sideEffectsResult = await pool.query(
    `
      SELECT
        medicine_id,
        side_effect_name
      FROM medicine_side_effects
      WHERE medicine_id = ANY($1::int[])
      ORDER BY medicine_id, id
    `,
    [[medicine1Id, medicine2Id]]
  );

  const usesMap = new Map<number, string[]>();
  const sideEffectsMap = new Map<number, string[]>();

  // ----------------------------------------------------------
  // Build uses map
  // ----------------------------------------------------------

  for (const row of usesResult.rows) {
    if (!usesMap.has(row.medicine_id)) {
      usesMap.set(row.medicine_id, []);
    }

    if (row.use_name) {
      usesMap.get(row.medicine_id)!.push(row.use_name);
    }
  }

  // ----------------------------------------------------------
  // Build side effects map
  // ----------------------------------------------------------

  for (const row of sideEffectsResult.rows) {
    if (!sideEffectsMap.has(row.medicine_id)) {
      sideEffectsMap.set(row.medicine_id, []);
    }

    if (row.side_effect_name) {
      sideEffectsMap
        .get(row.medicine_id)!
        .push(row.side_effect_name);
    }
  }

  // ----------------------------------------------------------
  // Build complete medicine objects
  // ----------------------------------------------------------

  const medicines: Medicine[] =
    medicineResult.rows.map((medicine) => ({
      ...medicine,

      uses: usesMap.get(medicine.id) ?? [],

      sideEffects:
        sideEffectsMap.get(medicine.id) ?? [],
    }));

  const medicine1 = medicines.find(
    (medicine) => medicine.id === medicine1Id
  );

  const medicine2 = medicines.find(
    (medicine) => medicine.id === medicine2Id
  );

  if (!medicine1 || !medicine2) {
    return null;
  }

  return {
    medicine1,
    medicine2,
  };
};