import pool from "../config/database.js";

import {
  findAlternatives,
} from "./alternativeFlaskService.js";

import type {
  AlternativeMedicineInput,
} from "../types/alternative.js";

interface GetAlternativesInput {
  medicineId: number;
}

export const getAlternatives = async ({
  medicineId,
}: GetAlternativesInput) => {

  // --------------------------------------------------
  // 1. Get selected medicine
  // --------------------------------------------------

  const medicineResult = await pool.query(
    `
    SELECT
      id,
      name,
      generic_name,
      therapeutic_class,
      action_class,
      chemical_class,
      habit_forming
    FROM medicines
    WHERE id = $1
    `,
    [medicineId]
  );

  if (medicineResult.rows.length === 0) {
    throw new Error("Medicine not found.");
  }

  const selectedMedicineRow =
    medicineResult.rows[0];


  // --------------------------------------------------
  // 2. Get selected medicine uses
  // --------------------------------------------------

  const selectedUsesResult =
    await pool.query(
      `
      SELECT
        use_name
      FROM medicine_uses
      WHERE medicine_id = $1
      ORDER BY id
      `,
      [medicineId]
    );

  const selectedUses =
    selectedUsesResult.rows.map(
      (row: { use_name: string }) =>
        row.use_name
    );


  // --------------------------------------------------
  // 3. Build selected medicine object
  // --------------------------------------------------

  const selectedMedicine:
    AlternativeMedicineInput = {

    id: selectedMedicineRow.id,

    name:
      selectedMedicineRow.name,

    genericName:
      selectedMedicineRow.generic_name,

    therapeuticClass:
      selectedMedicineRow.therapeutic_class,

    actionClass:
      selectedMedicineRow.action_class,

    chemicalClass:
      selectedMedicineRow.chemical_class,

    habitForming:
      selectedMedicineRow.habit_forming,

    uses:
      selectedUses,
  };


  // --------------------------------------------------
  // 4. Find relevant candidate medicines
  // --------------------------------------------------
  //
  // IMPORTANT:
  // We DO NOT load all 222k medicines.
  //
  // Candidates must share at least one of:
  // - action class
  // - therapeutic class
  // - chemical class
  //
  // Maximum 500 candidates are sent to Flask.
  // --------------------------------------------------

  const candidatesResult =
  await pool.query(
    `
    SELECT
      id,
      name,
      generic_name,
      therapeutic_class,
      action_class,
      chemical_class,
      habit_forming
    FROM medicines
    WHERE id <> $1
      AND (
        (
          $2::TEXT IS NOT NULL
          AND action_class = $2::TEXT
        )
        OR
        (
          $3::TEXT IS NOT NULL
          AND therapeutic_class = $3::TEXT
        )
        OR
        (
          $4::TEXT IS NOT NULL
          AND chemical_class = $4::TEXT
        )
      )
    ORDER BY
      CASE
        WHEN action_class = $2::TEXT
         AND therapeutic_class = $3::TEXT
         AND chemical_class = $4::TEXT
        THEN 1

        WHEN action_class = $2::TEXT
         AND therapeutic_class = $3::TEXT
        THEN 2

        WHEN action_class = $2::TEXT
         AND chemical_class = $4::TEXT
        THEN 3

        WHEN therapeutic_class = $3::TEXT
         AND chemical_class = $4::TEXT
        THEN 4

        ELSE 5
      END,
      id
    LIMIT 500
    `,
    [
      medicineId,
      selectedMedicineRow.action_class,
      selectedMedicineRow.therapeutic_class,
      selectedMedicineRow.chemical_class,
    ]
  );


  // --------------------------------------------------
  // 5. Get uses only for those candidates
  // --------------------------------------------------

  const candidateIds =
    candidatesResult.rows.map(
      (row) => row.id
    );

  const usesByMedicine =
    new Map<number, string[]>();

  if (candidateIds.length > 0) {

    const candidateUsesResult =
      await pool.query(
        `
        SELECT
          medicine_id,
          use_name
        FROM medicine_uses
        WHERE medicine_id = ANY($1::int[])
        ORDER BY medicine_id, id
        `,
        [candidateIds]
      );

    for (
      const row of candidateUsesResult.rows
    ) {

      if (
        !usesByMedicine.has(
          row.medicine_id
        )
      ) {
        usesByMedicine.set(
          row.medicine_id,
          []
        );
      }

      usesByMedicine
        .get(row.medicine_id)!
        .push(row.use_name);
    }
  }


  // --------------------------------------------------
  // 6. Build candidate objects
  // --------------------------------------------------

  const candidates:
    AlternativeMedicineInput[] =
    candidatesResult.rows.map(
      (row) => ({

        id:
          row.id,

        name:
          row.name,

        genericName:
          row.generic_name,

        therapeuticClass:
          row.therapeutic_class,

        actionClass:
          row.action_class,

        chemicalClass:
          row.chemical_class,

        habitForming:
          row.habit_forming,

        uses:
          usesByMedicine.get(
            row.id
          ) ?? [],
      })
    );


  // --------------------------------------------------
  // 7. Ask Flask to calculate similarity
  // --------------------------------------------------

  if (candidates.length === 0) {

    return {
      medicine:
        selectedMedicine,

      alternatives: [],
    };
  }

  const flaskResult =
    await findAlternatives(
      selectedMedicine,
      candidates
    );


  // --------------------------------------------------
  // 8. Validate Flask response
  // --------------------------------------------------

  if (!flaskResult.success) {

    throw new Error(
      flaskResult.message ||
        "Alternative medicine search failed."
    );
  }


  // --------------------------------------------------
  // 9. Return alternatives
  // --------------------------------------------------

  return {

    medicine:
      selectedMedicine,

    alternatives:
      flaskResult.data ?? [],
  };
};