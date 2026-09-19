import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import PatientDetailsForm from "../components/assessment/PatientDetailsForm";
import MedicineSearch from "../components/assessment/MedicineSearch";
import MedicineDetails from "../components/assessment/MedicineDetails";
import AssessmentResultCard from "../components/assessment/AssessmentResult";
import PredictedADRList from "../components/assessment/PredictedADR";
import SideEffects from "../components/assessment/SideEffects";
import Alternatives from "../components/assessment/Alternatives";
import PatientSafetyAlerts from "../components/assessment/PatientSafetyAlerts";
import { getPatients } from "../services/patientService";
import {
  runAssessment,
  type AssessmentResponse,
} from "../services/assessmentService";
import {
  getAlternatives,
  type AlternativeResult,
} from "../services/alternativeService";

import { getMedicineById } from "../services/medicineService";

import type { Patient } from "../types/patient";
import type {
  AssessmentPatient,
  Medicine,
} from "../types/assessment";

function Assessment() {
  const [searchParams] = useSearchParams();

  const [patients, setPatients] = useState<
    AssessmentPatient[]
  >([]);

  const [selectedPatient, setSelectedPatient] =
    useState<AssessmentPatient | null>(null);

  const [selectedMedicine, setSelectedMedicine] =
    useState<Medicine | null>(null);

  const [loadingPatients, setLoadingPatients] =
    useState(true);

  const [loadingMedicineDetails, setLoadingMedicineDetails] =
    useState(false);

  const [assessmentLoading, setAssessmentLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [alternativeWarning, setAlternativeWarning] =
    useState("");

  const [assessmentData, setAssessmentData] =
    useState<AssessmentResponse | null>(null);

  const [alternatives, setAlternatives] =
    useState<AlternativeResult[]>([]);

  // ==================================================
  // LOAD PATIENTS
  // ==================================================

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoadingPatients(true);
        setError("");

        const data = await getPatients();

        const mappedPatients: AssessmentPatient[] =
          data.map((patient: Patient) => ({
            id: patient.id,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            conditions: patient.conditions ?? [],
            allergies: patient.allergies ?? [],
            medications:
              (patient.medications ?? []).map(
                (medicine) => medicine.medicineName
              ),
          }));

        setPatients(mappedPatients);

        const patientIdParam =
          searchParams.get("patientId");

        if (patientIdParam) {
          const patientId = Number(patientIdParam);

          const patient = mappedPatients.find(
            (item) => item.id === patientId
          );

          if (patient) {
            setSelectedPatient(patient);
          }
        }
      } catch (err) {
        console.error(
          "Failed to load patients:",
          err
        );

        setError("Failed to load patients.");
      } finally {
        setLoadingPatients(false);
      }
    };

    loadPatients();
  }, [searchParams]);

  // ==================================================
  // PATIENT SELECTION
  // ==================================================

  const handlePatientSelect = (
    patient: AssessmentPatient | null
  ) => {
    setSelectedPatient(patient);
    setSelectedMedicine(null);
    setAssessmentData(null);
    setAlternatives([]);
    setAlternativeWarning("");
    setError("");
  };

  // ==================================================
  // MEDICINE SELECTION
  // ==================================================

  const handleMedicineSelect = async (
    medicine: Medicine
  ) => {
    try {
      setSelectedMedicine(medicine);
      setAssessmentData(null);
      setAlternatives([]);
      setAlternativeWarning("");
      setError("");

      setLoadingMedicineDetails(true);

      const fullMedicine = await getMedicineById(
        medicine.id
      );

      setSelectedMedicine(fullMedicine);
    } catch (err) {
      console.error(
        "Failed to load medicine details:",
        err
      );

      // Keep the medicine selected even if the
      // detailed request fails.
      setSelectedMedicine(medicine);

      setError(
        "Medicine selected, but complete medicine details could not be loaded."
      );
    } finally {
      setLoadingMedicineDetails(false);
    }
  };

  // ==================================================
  // CLEAR MEDICINE
  // ==================================================

  const handleMedicineClear = () => {
    setSelectedMedicine(null);
    setAssessmentData(null);
    setAlternatives([]);
    setAlternativeWarning("");
    setError("");
    setLoadingMedicineDetails(false);
  };

  // ==================================================
  // RUN ASSESSMENT
  // ==================================================

  const handleRunAssessment = async () => {
    if (!selectedPatient) {
      setError(
        "Please select a patient before running the assessment."
      );
      return;
    }

    if (!selectedMedicine) {
      setError(
        "Please select a medicine before running the assessment."
      );
      return;
    }

    try {
      setAssessmentLoading(true);
      setError("");
      setAlternativeWarning("");
      setAssessmentData(null);
      setAlternatives([]);

      const result = await runAssessment(
        selectedPatient.id,
        selectedMedicine.id
      );

      setAssessmentData(result);

      try {
        const alternativesResult =
          await getAlternatives(
            selectedMedicine.id
          );

        setAlternatives(
          alternativesResult.alternatives
        );
      } catch (alternativeError) {
        console.error(
          "Alternative search failed:",
          alternativeError
        );

        setAlternativeWarning(
          "Assessment completed, but alternative medicines could not be loaded."
        );
      }
    } catch (err) {
      console.error(
        "Assessment failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to run assessment."
      );
    } finally {
      setAssessmentLoading(false);
    }
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="mb-2 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
                Clinical Decision Support
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                ADR Assessment
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-6 text-slate-600">
                Evaluate potential adverse drug
                reactions and review documented
                side effects and similar medicines
                for a selected patient.
              </p>
            </div>

            {assessmentData && (
              <div className="flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Assessment ID
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  #{assessmentData.assessmentId}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
              !
            </div>

            <div>
              <p className="text-sm font-bold text-red-800">
                Assessment Error
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ==================================================
            INPUT AREA
        ================================================== */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ==================================================
              PATIENT
          ================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-700">
                  01
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Step 1
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Select Patient
                  </h2>
                </div>

              </div>
            </div>

            <div className="px-6 py-6">

              {loadingPatients ? (
                <div className="flex min-h-28 items-center justify-center rounded-xl bg-slate-50">
                  <p className="text-base font-medium text-slate-500">
                    Loading patients...
                  </p>
                </div>
              ) : (
                <PatientDetailsForm
                  patient={selectedPatient}
                  onPatientChange={
                    handlePatientSelect
                  }
                  patients={patients}
                />
              )}

            </div>

          </section>

          {/* ==================================================
              MEDICINE
          ================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-700">
                  02
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Step 2
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Select Medicine
                  </h2>
                </div>

              </div>
            </div>

            <div className="px-6 py-6">

              <MedicineSearch
                selectedMedicine={
                  selectedMedicine
                }
                onSelect={
                  handleMedicineSelect
                }
                onClear={
                  handleMedicineClear
                }
              />

              {loadingMedicineDetails && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  Loading complete medicine
                  information...
                </div>
              )}

              {selectedMedicine &&
                !loadingMedicineDetails && (
                  <div className="mt-5 space-y-5">

                    <MedicineDetails
                      medicine={
                        selectedMedicine
                      }
                    />

                    <SideEffects
                      sideEffects={
                        selectedMedicine.sideEffects ??
                        []
                      }
                    />

                  </div>
                )}

            </div>

          </section>

        </div>

        {/* ==================================================
            RUN ASSESSMENT
        ================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">

            <div>
              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-lg font-bold text-violet-700">
                  03
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                    Step 3
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Run AI Assessment
                  </h2>
                </div>

              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
  The selected medicine will be evaluated by the ADR
  prediction model, while the patient's recorded
  allergies, conditions, age, and current medications
  will be checked by the patient-safety layer.
</p>
            </div>

            <button
              type="button"
              onClick={handleRunAssessment}
              disabled={
                !selectedPatient ||
                !selectedMedicine ||
                loadingMedicineDetails ||
                assessmentLoading
              }
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-7 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
            >
              {assessmentLoading ? (
                <>
                  <Loader2
                    size={18}
                    className="mr-2 animate-spin"
                  />
                  Analyzing...
                </>
              ) : (
                "Run ADR Assessment"
              )}
            </button>

          </div>

          {assessmentLoading && (
            <div className="border-t border-slate-200 bg-blue-50 px-6 py-4">
              <div className="flex items-center gap-3">

                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

                <p className="text-sm font-semibold text-blue-800">
                  Analyzing medicine information
                  and generating assessment...
                </p>

              </div>
            </div>
          )}

        </section>

        {/* ==================================================
            RESULTS
        ================================================== */}

        {assessmentData && (
          <div className="space-y-6">

            {/* RESULT HEADER */}

            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-sm font-bold text-green-700">
                  OK
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-600">
                    Step 4
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    Assessment Results
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Review the model output and
                    medicine information below.
                  </p>
                </div>

              </div>
            </div>

            {/* PATIENT + MEDICINE SUMMARY */}

            <div className="grid gap-6 lg:grid-cols-2">

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Patient
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {assessmentData.patient.name}
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-3">

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Age
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {assessmentData.patient.age}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Gender
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {assessmentData.patient.gender}
                    </p>
                  </div>

                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Medicine Assessed
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {assessmentData.medicine.name}
                </h3>

                {assessmentData.medicine.genericName && (
                  <p className="mt-1 text-base font-medium text-slate-500">
                    {assessmentData.medicine.genericName}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">

                  {assessmentData.medicine.therapeuticClass && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                      {
                        assessmentData.medicine
                          .therapeuticClass
                      }
                    </span>
                  )}

                  {assessmentData.medicine.actionClass && (
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                      {
                        assessmentData.medicine
                          .actionClass
                      }
                    </span>
                  )}

                </div>
              </div>

            </div>

            {/* EXISTING ASSESSMENT RESULT */}

            {/* ==================================================
    ASSESSMENT SUMMARY
================================================== */}

<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

  <AssessmentResultCard
    result={assessmentData}
  />

</div>


{/* ==================================================
    PATIENT SAFETY
================================================== */}

<div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">

  <PatientSafetyAlerts
    safety={
      assessmentData.patientSafety
    }
  />

</div>


{/* ==================================================
    PREDICTED ADR
================================================== */}

            {/* PREDICTED ADR */}

            <div className="rounded-2xl border border-orange-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  AI Model Output
                </p>

                <h3 className="mt-1 text-2xl font-bold text-slate-900">
                  Predicted Adverse Reactions
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Potential ADRs identified by
                  the trained prediction model.
                </p>
              </div>

              <PredictedADRList
                prediction={
                  assessmentData.prediction
                }
              />

            </div>

            {/* DOCUMENTED SIDE EFFECTS */}

            <div className="rounded-2xl border border-orange-200 bg-white p-6 shadow-sm sm:p-8">

              <SideEffects
                sideEffects={
                  assessmentData.documentedSideEffects
                }
              />

            </div>

            {/* ALTERNATIVES */}

            <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">

              {alternativeWarning && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  {alternativeWarning}
                </div>
              )}

              <Alternatives
                alternatives={alternatives}
              />

            </div>

            {/* TIMESTAMP */}

            <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm font-semibold text-slate-600">
                Assessment #{assessmentData.assessmentId}
              </p>

              <p className="text-sm text-slate-500">
                Created{" "}
                {new Date(
                  assessmentData.createdAt
                ).toLocaleString()}
              </p>

            </div>

            {/* DISCLAIMER */}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">

              <div className="flex gap-4">

                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 font-bold text-amber-700">
                  !
                </div>

                <div>

                  <h3 className="text-base font-bold text-amber-900">
                    Clinical Review Required
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    MedGuard is an academic
                    clinical decision-support
                    prototype. Predicted ADRs are
                    model outputs and should be
                    reviewed by a qualified
                    clinician. This system does
                    not provide a diagnosis or
                    automatically prescribe or
                    substitute medicines.
                  </p>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default Assessment;
