import type {
  PatientSafetyAlert,
  PatientSafetyResult,
} from "../types/assessment.js";


// ======================================================
// TYPES
// ======================================================

interface SafetyPatient {
  age: number;

  gender: string;

  conditions: string[];

  allergies: string[];

  medications: {
    id: number;

    medicineId: number;

    medicineName: string;

    dosage: string | null;

    frequency: string | null;
  }[];
}


interface SafetyMedicine {
  id: number;

  name: string;

  genericName: string | null;

  therapeuticClass: string | null;

  actionClass: string | null;

  chemicalClass: string | null;

  habitForming: boolean;

  uses: string[];

  documentedSideEffects: string[];
}


// ======================================================
// NORMALIZATION
// ======================================================

const normalize = (
  value: unknown,
): string => {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ");
};


const tokenize = (
  value: unknown,
): string[] => {
  return normalize(value)
    .split(/\s+/)
    .filter(
      (token) =>
        token.length >= 3,
    );
};


// ======================================================
// TOKEN OVERLAP
// ======================================================

const hasMeaningfulTokenOverlap = (
  first: string,
  second: string,
): boolean => {

  const firstTokens =
    tokenize(first);

  const secondTokens =
    new Set(tokenize(second));

  if (
    firstTokens.length === 0 ||
    secondTokens.size === 0
  ) {
    return false;
  }

  return firstTokens.some(
    (token) =>
      secondTokens.has(token),
  );
};


// ======================================================
// MEDICINE SEARCH TEXT
// ======================================================

const buildMedicineSearchText = (
  medicine: SafetyMedicine,
): string => {

  return [
    medicine.name,

    medicine.genericName,

    medicine.therapeuticClass,

    medicine.actionClass,

    medicine.chemicalClass,

    ...medicine.uses,
  ]
    .filter(Boolean)
    .join(" ");
};


// ======================================================
// ALLERGY CHECK
//
// This intentionally looks for strong textual matches.
// It does NOT claim to be a complete allergy database.
// ======================================================

const checkAllergies = (
  patient: SafetyPatient,
  medicine: SafetyMedicine,
): PatientSafetyAlert[] => {

  const alerts: PatientSafetyAlert[] = [];

  const medicineText =
    buildMedicineSearchText(
      medicine,
    );


  for (
    const allergy
    of patient.allergies
  ) {

    const normalizedAllergy =
      normalize(allergy);

    if (
      !normalizedAllergy
    ) {
      continue;
    }


    const directMatch =
      hasMeaningfulTokenOverlap(
        normalizedAllergy,
        medicine.name,
      );


    const genericMatch =
      medicine.genericName
        ? hasMeaningfulTokenOverlap(
            normalizedAllergy,
            medicine.genericName,
          )
        : false;


    const chemicalMatch =
      medicine.chemicalClass
        ? hasMeaningfulTokenOverlap(
            normalizedAllergy,
            medicine.chemicalClass,
          )
        : false;


    if (
      directMatch ||
      genericMatch ||
      chemicalMatch
    ) {

      alerts.push({
        type: "allergy",

        severity: "critical",

        title:
          "Potential allergy conflict",

        message:
          `The patient's recorded allergy "${allergy}" ` +
          `matches information associated with ${medicine.name}. ` +
          `Clinical review is required before use.`,

        matchedValue:
          allergy,

        evidence:
          directMatch
            ? "Medicine name"
            : genericMatch
              ? "Generic medicine name"
              : "Chemical class",
      });
    }
  }


  return alerts;
};


// ======================================================
// CURRENT MEDICATION CHECK
//
// This detects whether the selected medicine is already
// recorded as a current medication.
//
// It does NOT claim a drug-drug interaction.
// ======================================================

const checkCurrentMedication = (
  patient: SafetyPatient,
  medicine: SafetyMedicine,
): PatientSafetyAlert[] => {

  const alerts: PatientSafetyAlert[] = [];

  const targetName =
    normalize(medicine.name);

  const targetGeneric =
    normalize(
      medicine.genericName,
    );


  for (
    const medication
    of patient.medications
  ) {

    const currentName =
      normalize(
        medication.medicineName,
      );


    if (
      !currentName
    ) {
      continue;
    }


    const sameMedicine =
      currentName === targetName ||
      (
        targetGeneric.length > 0 &&
        currentName === targetGeneric
      );


    if (
      sameMedicine
    ) {

      alerts.push({
        type: "current_medication",

        severity: "warning",

        title:
          "Medicine already recorded",

        message:
          `${medicine.name} is already listed among ` +
          `the patient's current medications. ` +
          `Review the intended dosage and frequency ` +
          `before adding or prescribing it again.`,

        matchedValue:
          medication.medicineName,

        evidence:
          "Patient medication history",
      });
    }
  }


  return alerts;
};


// ======================================================
// CONDITION REVIEW
//
// We intentionally do NOT infer contraindications from
// arbitrary word matching.
//
// Instead, conditions trigger a review notice when the
// system does not have structured contraindication data.
// ======================================================

const checkConditions = (
  patient: SafetyPatient,
  medicine: SafetyMedicine,
): PatientSafetyAlert[] => {

  if (
    patient.conditions.length === 0
  ) {
    return [];
  }


  return [
    {
      type: "condition",

      severity: "info",

      title:
        "Patient conditions require review",

      message:
        `The patient has ${patient.conditions.length} ` +
        `recorded condition(s). MedGuard's current local ` +
        `medicine dataset does not provide a validated ` +
        `patient-specific contraindication mapping for ` +
        `${medicine.name}. Review the patient's conditions ` +
        `against authoritative prescribing information.`,

      evidence:
        patient.conditions.join(", "),
    },
  ];
};


// ======================================================
// AGE REVIEW
//
// This is intentionally a review flag rather than a
// clinical age-risk prediction.
// ======================================================

const checkAge = (
  patient: SafetyPatient,
  medicine: SafetyMedicine,
): PatientSafetyAlert[] => {

  if (
    patient.age >= 65
  ) {

    return [
      {
        type: "age",

        severity: "info",

        title:
          "Older adult review required",

        message:
          `The patient is ${patient.age} years old. ` +
          `Review age-related dosing, renal/hepatic function, ` +
          `polypharmacy, and prescribing information for ` +
          `${medicine.name}.`,

        matchedValue:
          String(patient.age),

        evidence:
          "Patient age",
      },
    ];
  }


  if (
    patient.age < 18
  ) {

    return [
      {
        type: "age",

        severity: "info",

        title:
          "Pediatric review required",

        message:
          `The patient is ${patient.age} years old. ` +
          `Confirm pediatric dosing, age restrictions, ` +
          `and prescribing information for ${medicine.name}.`,

        matchedValue:
          String(patient.age),

        evidence:
          "Patient age",
      },
    ];
  }


  return [];
};


// ======================================================
// MAIN SAFETY ANALYSIS
// ======================================================

export const analyzePatientSafety = (
  patient: SafetyPatient,
  medicine: SafetyMedicine,
): PatientSafetyResult => {

  const alerts: PatientSafetyAlert[] = [];


  // --------------------------------------------------
  // Allergy
  // --------------------------------------------------

  alerts.push(
    ...checkAllergies(
      patient,
      medicine,
    ),
  );


  // --------------------------------------------------
  // Current medication
  // --------------------------------------------------

  alerts.push(
    ...checkCurrentMedication(
      patient,
      medicine,
    ),
  );


  // --------------------------------------------------
  // Conditions
  // --------------------------------------------------

  alerts.push(
    ...checkConditions(
      patient,
      medicine,
    ),
  );


  // --------------------------------------------------
  // Age
  // --------------------------------------------------

  alerts.push(
    ...checkAge(
      patient,
      medicine,
    ),
  );


  const criticalCount =
    alerts.filter(
      (alert) =>
        alert.severity ===
        "critical",
    ).length;


  const warningCount =
    alerts.filter(
      (alert) =>
        alert.severity ===
        "warning",
    ).length;


  const infoCount =
    alerts.filter(
      (alert) =>
        alert.severity ===
        "info",
    ).length;


  return {

    hasAlerts:
      alerts.length > 0,

    alertCount:
      alerts.length,

    criticalCount,

    warningCount,

    infoCount,

    alerts,

    summary: {

      allergyConflict:
        alerts.some(
          (alert) =>
            alert.type ===
              "allergy" &&
            alert.severity ===
              "critical",
        ),

      currentMedicationConflict:
        alerts.some(
          (alert) =>
            alert.type ===
            "current_medication",
        ),

      conditionReviewRequired:
        alerts.some(
          (alert) =>
            alert.type ===
            "condition",
        ),

      ageReviewRequired:
        alerts.some(
          (alert) =>
            alert.type ===
            "age",
        ),
    },
  };
};