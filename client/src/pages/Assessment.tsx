import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Loader2, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import {
  getMedicineRecommendations,
  type MedicineRecommendations,
} from "../services/recommendationService";
import {
  getAIMedicineDetails,
  type AIMedicineDetails,
} from "../services/medicineAiInfoService";
import {
  addPatientClinicalNote,
  getPatients,
} from "../services/patientService";
import { saveAssessment } from "../services/assessmentService";
import type { Patient } from "../types/patient";

const fieldClass =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

const splitEntries = (value: string) =>
  value.split(/[\n,;]+/).map((entry) => entry.trim()).filter(Boolean);

function Assessment() {
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [problem, setProblem] = useState("");
  const [sideEffects, setSideEffects] = useState("");
  const [recommendations, setRecommendations] =
    useState<MedicineRecommendations | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [medicineDetails, setMedicineDetails] = useState<
    Record<number, AIMedicineDetails>
  >({});
  const [detailsLoading, setDetailsLoading] = useState<number | null>(null);
  const [detailsErrors, setDetailsErrors] = useState<Record<number, string>>({});
  const [savingReport, setSavingReport] = useState<number | null>(null);
  const [savedReports, setSavedReports] = useState<Record<number, boolean>>({});
  const [reportErrors, setReportErrors] = useState<Record<number, string>>({});
  const [medicationFormFor, setMedicationFormFor] = useState<number | null>(null);
  const [medicationValues, setMedicationValues] = useState({
    dosage: "",
    frequency: "",
    endDate: "",
  });
  const [savingMedication, setSavingMedication] = useState<number | null>(null);
  const [savedMedications, setSavedMedications] = useState<Record<number, boolean>>({});
  const [medicationErrors, setMedicationErrors] = useState<Record<number, string>>({});
  const [savingRecommendationReport, setSavingRecommendationReport] = useState<number | null>(null);
  const [savedRecommendationReports, setSavedRecommendationReports] = useState<Record<number, boolean>>({});
  const [recommendationReportErrors, setRecommendationReportErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    let active = true;

    const loadPatients = async () => {
      try {
        setError("");
        const loadedPatients = await getPatients();
        if (!active) {
          return;
        }

        setPatients(loadedPatients);
        const requestedPatientId = Number(searchParams.get("patientId"));
        if (
          Number.isInteger(requestedPatientId) &&
          loadedPatients.some((patient) => patient.id === requestedPatientId)
        ) {
          setSelectedPatientId(requestedPatientId);
        }
      } catch (loadError) {
        console.error("Failed to load patients for ADR assessment:", loadError);
        if (active) {
          setError("Could not load patients. Please try again.");
        }
      } finally {
        if (active) {
          setLoadingPatients(false);
        }
      }
    };

    void loadPatients();
    return () => {
      active = false;
    };
  }, [searchParams]);

  const selectedPatient = patients.find(
    (patient) => patient.id === selectedPatientId,
  );

  const clearResults = () => {
    setRecommendations(null);
    setError("");
    setMedicineDetails({});
    setDetailsErrors({});
    setSavedReports({});
    setReportErrors({});
    setMedicationFormFor(null);
    setSavedMedications({});
    setMedicationErrors({});
    setSavedRecommendationReports({});
    setRecommendationReportErrors({});
  };

  const handleGetMedicineDetails = async (medicineId: number) => {
    setDetailsLoading(medicineId);
    setDetailsErrors((current) => ({ ...current, [medicineId]: "" }));
    try {
      const details = await getAIMedicineDetails(medicineId);
      setMedicineDetails((current) => ({ ...current, [medicineId]: details }));
    } catch (detailsError) {
      console.error("Failed to load AI medicine details:", detailsError);
      setDetailsErrors((current) => ({
        ...current,
        [medicineId]:
          detailsError instanceof Error
            ? detailsError.message
            : "Could not load medicine details.",
      }));
    } finally {
      setDetailsLoading(null);
    }
  };

  const handleSaveMedicineReport = async (
    medicineId: number,
    medicineName: string,
    details: AIMedicineDetails,
  ) => {
    if (!selectedPatientId) {
      setReportErrors((current) => ({
        ...current,
        [medicineId]: "Select a patient before saving this report.",
      }));
      return;
    }

    const report = [
      `AI-generated medicine report: ${medicineName}`,
      `Saved: ${new Date().toLocaleString()}`,
      "",
      details.description.replace(/\*\*(.*?)\*\*/g, "$1"),
      "",
      "AI-generated educational information only. Verify against an authoritative medicine label and clinician review.",
    ].join("\n");

    setSavingReport(medicineId);
    setReportErrors((current) => ({ ...current, [medicineId]: "" }));
    try {
      await addPatientClinicalNote(selectedPatientId, report);
      setSavedReports((current) => ({ ...current, [medicineId]: true }));
    } catch (saveError) {
      console.error("Failed to save AI medicine report:", saveError);
      setReportErrors((current) => ({
        ...current,
        [medicineId]:
          saveError instanceof Error
            ? saveError.message
            : "Could not save this medicine report.",
      }));
    } finally {
      setSavingReport(null);
    }
  };

  const handleSaveMedicine = async (
    event: FormEvent<HTMLFormElement>,
    recommendation: MedicineRecommendations["recommendations"][number],
  ) => {
    event.preventDefault();
    const medicineId = recommendation.medicine.id;
    if (!selectedPatientId) {
      setMedicationErrors((current) => ({
        ...current,
        [medicineId]: "Select a patient before saving this medicine.",
      }));
      return;
    }

    setSavingMedication(medicineId);
    setMedicationErrors((current) => ({ ...current, [medicineId]: "" }));
    try {
      await saveAssessment(
        selectedPatientId,
        medicineId,
        {
          dosage: medicationValues.dosage.trim(),
          frequency: medicationValues.frequency.trim(),
          endDate: medicationValues.endDate,
        },
        splitEntries(problem),
        splitEntries(sideEffects),
        "prescribed",
        recommendations?.recommendations
          .map((item) => item.medicine.id)
          .filter((id) => id !== medicineId)
          .slice(0, 30) ?? [],
      );
      setSavedMedications((current) => ({ ...current, [medicineId]: true }));
      setMedicationFormFor(null);

      try {
        await saveRecommendationReport(recommendation);
      } catch (saveError) {
        console.error("Medicine saved, but recommendation report could not be saved:", saveError);
        setRecommendationReportErrors((current) => ({
          ...current,
          [medicineId]:
            saveError instanceof Error
              ? saveError.message
              : "The medicine was saved, but its report could not be saved.",
        }));
      }
    } catch (saveError) {
      console.error("Failed to save recommended medicine:", saveError);
      setMedicationErrors((current) => ({
        ...current,
        [medicineId]:
          saveError instanceof Error
            ? saveError.message
            : "Could not save this medicine.",
      }));
    } finally {
      setSavingMedication(null);
    }
  };

  const saveRecommendationReport = async (
    recommendation: MedicineRecommendations["recommendations"][number],
  ) => {
    if (!selectedPatientId || !recommendations) {
      throw new Error("Select a patient and generate recommendations before saving the report.");
    }

    const { medicine, similarityPercent, matchedUses, knownSideEffectMatches } =
      recommendation;
    const report = [
      `AI-generated medicine recommendation report: ${medicine.name}`,
      `Saved: ${new Date().toLocaleString()}`,
      `Patient problem: ${problem.trim()}`,
      `Dosage: ${medicationValues.dosage.trim()}`,
      `Frequency: ${medicationValues.frequency.trim()}`,
      `End date: ${medicationValues.endDate}`,
      "",
      "Common symptoms for the entered problem",
      recommendations.commonSymptoms ||
        "Common symptoms could not be identified from the entered description.",
      "",
      `Medicine match: ${similarityPercent}% similarity (not a probability of treatment success)`,
      `Database-listed use: ${matchedUses.join("; ") || "None listed"}`,
      `Known side-effect overlap: ${knownSideEffectMatches.join(", ") || "None identified"}`,
      "",
      "AI-generated educational information only. This is not a diagnosis or prescription; verify with an authoritative medicine label and clinician review.",
    ].join("\n");

    setSavingRecommendationReport(medicine.id);
    setRecommendationReportErrors((current) => ({
      ...current,
      [medicine.id]: "",
    }));
    try {
      await addPatientClinicalNote(selectedPatientId, report);
      setSavedRecommendationReports((current) => ({
        ...current,
        [medicine.id]: true,
      }));
    } finally {
      setSavingRecommendationReport(null);
    }
  };

  const handleRecommend = async () => {
    if (!selectedPatientId) {
      setError("Select a patient first.");
      return;
    }

    const problems = splitEntries(problem);
    const reportedSideEffects = splitEntries(sideEffects);
    if (problems.length === 0) {
      setError("Enter the patient's problem to find medicine matches.");
      return;
    }
    if (problems.length > 10 || reportedSideEffects.length > 10) {
      setError("Enter no more than 10 problems and 10 side effects.");
      return;
    }
    if (
      [...problems, ...reportedSideEffects].some((entry) => entry.length > 200)
    ) {
      setError("Keep each problem and side effect under 200 characters.");
      return;
    }

    setSearching(true);
    setError("");
    setRecommendations(null);
    try {
      const results = await getMedicineRecommendations(
        selectedPatientId,
        problems,
        reportedSideEffects,
      );
      setRecommendations(results);
    } catch (recommendationError) {
      console.error("Failed to find medicine matches:", recommendationError);
      setError(
        recommendationError instanceof Error
          ? recommendationError.message
          : "Could not find medicine matches. Please try again.",
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-700">PATIENT CARE</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">ADR Assessment</h1>
        <p className="mt-2 text-slate-600">
          Select a patient, describe the problem and any current side effects,
          and review AI-ranked matches from the medicine database.
        </p>
      </header>

      <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <label className="block text-sm font-semibold text-slate-800">
          Patient
          <select
            value={selectedPatientId ?? ""}
            onChange={(event) => {
              setSelectedPatientId(
                event.target.value ? Number(event.target.value) : null,
              );
              clearResults();
            }}
            disabled={loadingPatients || searching || patients.length === 0}
            className={fieldClass}
          >
            <option value="">
              {loadingPatients ? "Loading patients..." : "Select a patient"}
            </option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} · {patient.age} years
              </option>
            ))}
          </select>
        </label>

        {selectedPatient && (
          <p className="text-sm text-slate-600">
            {selectedPatient.age} years · {selectedPatient.gender}
            {selectedPatient.allergies.length > 0 && (
              <span className="ml-2 text-amber-800">
                · Recorded allergies: {selectedPatient.allergies.join(", ")}
              </span>
            )}
          </p>
        )}

        {!loadingPatients && patients.length === 0 && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            No patients found. Add a patient record before starting an assessment.
          </p>
        )}

        <label className="block text-sm font-semibold text-slate-800">
          Patient problem
          <textarea
            value={problem}
            onChange={(event) => {
              setProblem(event.target.value);
              clearResults();
            }}
            placeholder="Describe the main problem, for example: migraine"
            rows={3}
            maxLength={2000}
            disabled={searching}
            className={fieldClass}
          />
          <span className="mt-1 block font-normal text-slate-500">
            Add more than one problem on separate lines if needed.
          </span>
        </label>

        <label className="block text-sm font-semibold text-slate-800">
          Current side effects{" "}
          <span className="font-normal text-slate-500">(optional)</span>
          <textarea
            value={sideEffects}
            onChange={(event) => {
              setSideEffects(event.target.value);
              clearResults();
            }}
            placeholder="List any side effects the patient is experiencing"
            rows={2}
            maxLength={2000}
            disabled={searching}
            className={fieldClass}
          />
          <span className="mt-1 block font-normal text-slate-500">
            These are checked against known side effects and shown as warnings.
          </span>
        </label>

        <p className="rounded-lg bg-blue-50 p-3 text-sm leading-5 text-blue-900">
          The problem and side effects you enter, plus a limited list of
          matching medicine names and database uses, are sent to Gemini to rank
          matches. Patient identity and medical history are not sent.
        </p>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleRecommend()}
          disabled={loadingPatients || searching || !selectedPatientId}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {searching ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Finding matches...
            </>
          ) : (
            <>
              <Search size={17} />
              Find medicine matches
            </>
          )}
        </button>
      </section>

      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        AI match estimates are generated from the problem description and
        medicine-use records in the database. They are not calibrated
        probabilities, evidence of treatment success, prescriptions, or
        patient-specific clinical recommendations. Review allergies, other
        medicines, and the full clinical context before making decisions.
      </p>

      {recommendations !== null && (
        <section aria-live="polite" className="space-y-3">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
            <h2 className="text-xl font-bold text-slate-900">
              {recommendations.rankingMethod === "ai"
                ? "AI-ranked medicine matches"
                : "Database medicine matches"}
            </h2>
            <span className="text-sm text-slate-500">
              {recommendations.analyzedCandidates} shown
            </span>
          </div>

          {recommendations.notice && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {recommendations.notice}
            </p>
          )}

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-950">
              Common symptoms for the entered problem
            </h3>
            <p className="mt-1 text-sm leading-6 text-blue-900">
              {recommendations.commonSymptoms ||
                "Common symptoms could not be identified from this description. Enter a confirmed disease or condition name to request an educational summary."}
            </p>
            <p className="mt-2 text-xs leading-5 text-blue-800">
              AI-generated general information, not a diagnosis or a statement
              about this patient. Verify with a clinician.
            </p>
          </div>

          {recommendations.totalCandidates > recommendations.analyzedCandidates && (
            <p className="text-sm text-slate-600">
              Showing the top {recommendations.analyzedCandidates} of{" "}
              {recommendations.totalCandidates} database matches.
            </p>
          )}

          {recommendations.recommendations.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              No database indication matched that problem. Try a different
              description; this does not mean that no treatment is available.
            </p>
          ) : (
            <ol className="space-y-3">
              {recommendations.recommendations.map((recommendation) => (
                <li
                  key={recommendation.medicine.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {recommendation.medicine.name}
                      </h3>
                      {recommendation.medicine.genericName && (
                        <p className="mt-1 text-sm text-slate-500">
                          {recommendation.medicine.genericName}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-blue-700">
                      {recommendation.similarityPercent}%{" "}
                      {recommendations.rankingMethod === "ai"
                        ? "AI relevance"
                        : "match"}
                    </p>
                  </div>

                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                    role="meter"
                    aria-label={`${recommendation.similarityPercent}% ${
                      recommendations.rankingMethod === "ai"
                        ? "AI relevance"
                        : "database match"
                    }`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={recommendation.similarityPercent}
                  >
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${recommendation.similarityPercent}%` }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    Matching database use: {recommendation.matchedUses.join("; ")}
                  </p>

                  {recommendation.knownSideEffectMatches.length > 0 && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                      <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                      Known side-effect overlap:{" "}
                      {recommendation.knownSideEffectMatches.join(", ")}
                    </p>
                  )}

                  <div className="mt-4">
                    {savedMedications[recommendation.medicine.id] ? (
                      <p className="text-sm font-medium text-emerald-700">
                        Medicine saved to patient history
                      </p>
                    ) : medicationFormFor === recommendation.medicine.id ? (
                      <form
                        onSubmit={(event) =>
                          void handleSaveMedicine(event, recommendation)
                        }
                        className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2"
                      >
                        <label className="text-sm font-medium text-slate-700">
                          Dosage *
                          <input
                            required
                            maxLength={100}
                            value={medicationValues.dosage}
                            onChange={(event) =>
                              setMedicationValues((current) => ({
                                ...current,
                                dosage: event.target.value,
                              }))
                            }
                            placeholder="Enter clinician-directed dosage"
                            className={`${fieldClass} mt-1`}
                          />
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Frequency *
                          <input
                            required
                            maxLength={200}
                            value={medicationValues.frequency}
                            onChange={(event) =>
                              setMedicationValues((current) => ({
                                ...current,
                                frequency: event.target.value,
                              }))
                            }
                            placeholder="Enter clinician-directed frequency"
                            className={`${fieldClass} mt-1`}
                          />
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          End date *
                          <input
                            required
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            value={medicationValues.endDate}
                            onChange={(event) =>
                              setMedicationValues((current) => ({
                                ...current,
                                endDate: event.target.value,
                              }))
                            }
                            className={`${fieldClass} mt-1`}
                          />
                        </label>
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <button
                            type="submit"
                            disabled={savingMedication === recommendation.medicine.id}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                          >
                            {savingMedication === recommendation.medicine.id
                              ? "Saving medicine..."
                              : "Save medicine"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMedicationFormFor(null)}
                            disabled={savingMedication === recommendation.medicine.id}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setMedicationValues({
                            dosage: "",
                            frequency: "",
                            endDate: "",
                          });
                          setMedicationErrors((current) => ({
                            ...current,
                            [recommendation.medicine.id]: "",
                          }));
                          setMedicationFormFor(recommendation.medicine.id);
                        }}
                        className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Save medicine to patient history
                      </button>
                    )}
                    {medicationErrors[recommendation.medicine.id] && (
                      <p role="alert" className="mt-2 text-sm text-red-700">
                        {medicationErrors[recommendation.medicine.id]}
                      </p>
                    )}
                    {savedMedications[recommendation.medicine.id] &&
                      !savedRecommendationReports[recommendation.medicine.id] && (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm text-slate-600">
                            Medicine saved to patient history.
                          </p>
                          {recommendationReportErrors[recommendation.medicine.id] && (
                            <p role="alert" className="text-sm text-red-700">
                              Report could not be saved:{" "}
                              {recommendationReportErrors[recommendation.medicine.id]}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              void saveRecommendationReport(recommendation).catch(
                                (saveError: unknown) => {
                                  console.error("Failed to retry recommendation report save:", saveError);
                                  setRecommendationReportErrors((current) => ({
                                    ...current,
                                    [recommendation.medicine.id]:
                                      saveError instanceof Error
                                        ? saveError.message
                                        : "Could not save this report.",
                                  }));
                                },
                              )
                            }
                            disabled={
                              savingRecommendationReport ===
                              recommendation.medicine.id
                            }
                            className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                          >
                            {savingRecommendationReport === recommendation.medicine.id
                              ? "Saving report..."
                              : "Retry report save"}
                          </button>
                        </div>
                      )}
                    {savedRecommendationReports[recommendation.medicine.id] && (
                      <p className="mt-2 text-sm font-medium text-emerald-700">
                        Medicine and recommendation report saved to patient history.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    {!medicineDetails[recommendation.medicine.id] ? (
                      <button
                        type="button"
                        onClick={() =>
                          void handleGetMedicineDetails(
                            recommendation.medicine.id,
                          )
                        }
                        disabled={detailsLoading !== null}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                      >
                        {detailsLoading === recommendation.medicine.id ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Getting details...
                          </>
                        ) : (
                          "Get AI details"
                        )}
                      </button>
                    ) : (
                      <div className="space-y-4 rounded-lg bg-slate-50 p-4">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            AI medicine description
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            <HighlightedDescription
                              text={medicineDetails[recommendation.medicine.id].description}
                            />
                          </p>
                        </div>
                        <p className="text-xs leading-5 text-slate-500">
                          AI-generated educational information, not medical
                          advice. Information is limited to the medicine
                          database record; verify against an authoritative
                          label and clinician review.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              void handleSaveMedicineReport(
                                recommendation.medicine.id,
                                recommendation.medicine.name,
                                medicineDetails[recommendation.medicine.id],
                              )
                            }
                            disabled={
                              savingReport === recommendation.medicine.id ||
                              savedReports[recommendation.medicine.id]
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {savingReport === recommendation.medicine.id
                              ? "Saving report..."
                              : savedReports[recommendation.medicine.id]
                                ? "Report saved to patient history"
                                : "Save medicine report"}
                          </button>
                          {reportErrors[recommendation.medicine.id] && (
                            <p role="alert" className="text-sm text-red-700">
                              {reportErrors[recommendation.medicine.id]}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {detailsErrors[recommendation.medicine.id] && (
                      <p role="alert" className="mt-2 text-sm text-red-700">
                        {detailsErrors[recommendation.medicine.id]}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </main>
  );
}

function HighlightedDescription({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default Assessment;
