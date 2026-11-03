import pool from "../config/database.js";

import {
  findAlternatives,
} from "./alternativeFlaskService.js";

import type {
  AlternativeMedicineInput,
  AlternativeResult,
  ExcludedAlternative,
} from "../types/alternative.js";
import { uniqueMedicineLabels } from "../utils/medicineData.js";
import { getPatientById } from "./patientService.js";

interface GetAlternativesInput {
  medicineId: number;
  patientId: number;
  doctorId: number;
}

const normalize = (value: string | null | undefined) =>
  String(value ?? "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ");

export const getAlternatives = async ({
  medicineId,
  patientId,
  doctorId,
}: GetAlternativesInput) => {
  const patient = await getPatientById(patientId, doctorId);
  if (!patient) {
    throw new Error("Patient not found.");
  }

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

  const selectedEffectsResult = await pool.query(
    `
    SELECT side_effect_name
    FROM medicine_side_effects
    WHERE medicine_id = $1
    ORDER BY id
    `,
    [medicineId],
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

    sideEffects: uniqueMedicineLabels(
      selectedEffectsResult.rows.map((row) => row.side_effect_name),
    ),
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
  const sideEffectsByMedicine =
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

    const candidateEffectsResult = await pool.query(
      `
      SELECT medicine_id, side_effect_name
      FROM medicine_side_effects
      WHERE medicine_id = ANY($1::int[])
      ORDER BY medicine_id, id
      `,
      [candidateIds],
    );

    for (const row of candidateEffectsResult.rows) {
      const effects = sideEffectsByMedicine.get(row.medicine_id) ?? [];
      effects.push(row.side_effect_name);
      sideEffectsByMedicine.set(row.medicine_id, effects);
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

        sideEffects: uniqueMedicineLabels(
          sideEffectsByMedicine.get(row.id) ?? [],
        ),
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
      excludedCandidates: [],
      screeningLimitations: [
        "Metadata similarity is not patient compatibility or clinical equivalence.",
        "Clinician review is required before considering any alternative.",
      ],
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

  const allergyNames: string[] = (patient.allergyDetails ?? []).map(
    (allergy: { allergyName: string }) => normalize(allergy.allergyName),
  );
  const priorReactions: { medicineName: string; reaction: string }[] =
    (patient.adverseReactions ?? [])
    .map((reaction: { suspectedMedicine: string; reaction: string }) => ({
      medicineName: normalize(reaction.suspectedMedicine),
      reaction: reaction.reaction,
    }))
    .filter((reaction: { medicineName: string; reaction: string }) => reaction.medicineName);

  const excludedCandidates: ExcludedAlternative[] = [];
  const screenedAlternatives: AlternativeResult[] = [];

  for (const alternative of flaskResult.data ?? []) {
    const candidateNames = [
      alternative.medicine.name,
      alternative.medicine.genericName,
      alternative.medicine.chemicalClass,
    ].map(normalize).filter(Boolean);

    const conflicts = [
      ...allergyNames
        .filter((allergy) => candidateNames.includes(allergy))
        .map((allergy) => `Recorded allergy matches ${allergy}`),
      ...priorReactions
        .filter((history) => candidateNames.includes(history.medicineName))
        .map((history) => `Previous reaction recorded: ${history.reaction}`),
    ];

    if (conflicts.length > 0) {
      excludedCandidates.push({
        medicineName: alternative.medicine.name,
        reasons: conflicts,
      });
      continue;
    }

    screenedAlternatives.push({
      ...alternative,
      eligibilityStatus: "review_required",
      patientWarnings: [
        "Exact recorded-name matching is not exhaustive.",
        "Validated interaction, indication, condition, age, kidney, and liver compatibility checks are unavailable.",
      ],
      previousReactionMatches: [],
    });
  }

  return {

    medicine:
      selectedMedicine,

    alternatives:
      screenedAlternatives,
    excludedCandidates,
    screeningLimitations: [
      "Metadata similarity is not patient compatibility or clinical equivalence.",
      "Only exact recorded allergy/reaction name matches are excluded; screening is not exhaustive.",
      "Validated interaction, condition, age, and kidney/liver compatibility mappings are unavailable.",
      "Clinician review is required before considering any alternative.",
    ],
  };
};