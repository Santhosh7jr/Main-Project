import { Activity, CalendarClock, Pill, UserRound } from "lucide-react";

import { useNavigate } from "react-router-dom";

import type { ReportAssessment } from "../../types/report";

interface ReportCardProps {
  assessment: ReportAssessment;
}

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const summarizeSnapshotRecords = (records: unknown[]) =>
  records
    .map((record) => {
      if (!record || typeof record !== "object") return "";
      const value = record as Record<string, unknown>;
      return [
        value.medicineName ?? value.suspectedMedicine ?? value.measurementName,
        value.reaction,
        value.valueText ?? value.value,
        value.unit,
        value.dosage,
        value.frequency,
      ]
        .filter((part): part is string | number => typeof part === "string" || typeof part === "number")
        .join(" · ");
    })
    .filter(Boolean)
    .join("; ") || "None recorded";

function ReportCard({ assessment }: ReportCardProps) {
  const navigate = useNavigate();

  const predictions = assessment.predictions ?? [];
  const patientSafety = assessment.patientSafetySnapshot;
  const safetyAlerts = Array.isArray(patientSafety.alerts)
    ? patientSafety.alerts
      .map((alert) =>
        alert && typeof alert === "object" &&
        "title" in alert && typeof alert.title === "string"
          ? alert.title
          : null,
      )
      .filter((title): title is string => title !== null)
    : [];
  const missingSafetyInformation = Array.isArray(patientSafety.missingInformation)
    ? patientSafety.missingInformation.filter(
      (item): item is string => typeof item === "string",
    )
    : [];

  return (
    <article
      onClick={() => navigate(`/patients/${assessment.patientId}`)}
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assessment #{assessment.id}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {/* PATIENT */}

            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <UserRound size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">Patient</p>

                <p className="truncate text-sm font-semibold text-slate-900">
                  {assessment.patientName}
                </p>
              </div>
            </div>

            {/* MEDICINE */}

            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Pill size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">Medicine</p>

                <p className="truncate text-sm font-semibold text-slate-900">
                  {assessment.medicineName}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {[assessment.dosage, assessment.frequency]
                    .filter(Boolean)
                    .join(" • ") || "Dose and frequency not recorded"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  End date:{" "}
                  {assessment.patientMedicationId
                    ? assessment.endDate
                      ? new Date(
                          `${assessment.endDate}T00:00:00`,
                        ).toLocaleDateString()
                      : "Ongoing"
                    : "Not recorded"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-96">
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Activity size={15} />

              <span className="text-xs font-medium">Legacy score indicator*</span>
            </div>

            <p className="mt-1 font-bold text-slate-900">
              {assessment.confidence === null
                ? "Not available"
                : assessment.confidence.toFixed(3)}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-400">Model-predicted ADRs</p>

            <p className="mt-1 font-bold text-slate-900">
              {assessment.adrCount}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-slate-400">
              <CalendarClock size={15} />

              <span className="text-xs font-medium">Created</span>
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-700">
              {formatDate(assessment.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">*Legacy score indicator is a heuristic, not calibrated confidence or probability. Model-signal categories are not clinical risk levels.</p>

      {/* PREDICTIONS */}

      {predictions.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Top Predictions
          </p>

          <div className="flex flex-wrap gap-2">
            {predictions.slice(0, 5).map((prediction) => (
              <span
                key={`${assessment.id}-${prediction.adr}`}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                {prediction.adr}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Doctor decision
          </p>
          <p className="mt-1 text-sm font-medium capitalize text-slate-700">
            {assessment.doctorDecision?.replace(/_/g, " ") ?? "Not recorded"}
          </p>
        </div>
        {assessment.currentComplaints.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Complaints recorded
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {assessment.currentComplaints.join(", ")}
            </p>
          </div>
        )}
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Patient context at assessment
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {[
              assessment.patientSnapshot.age == null
                ? null
                : `${assessment.patientSnapshot.age} years`,
              assessment.patientSnapshot.gender,
              assessment.patientSnapshot.conditions.length
                ? `Conditions: ${assessment.patientSnapshot.conditions.join(", ")}`
                : null,
              assessment.patientSnapshot.allergies.length
                ? `Allergies: ${assessment.patientSnapshot.allergies.join(", ")}`
                : null,
              assessment.patientSnapshot.medications.length
                ? `Medicines: ${summarizeSnapshotRecords(assessment.patientSnapshot.medications)}`
                : "Medicines: none recorded",
              assessment.patientSnapshot.adverseReactions.length
                ? `Previous reactions: ${summarizeSnapshotRecords(assessment.patientSnapshot.adverseReactions)}`
                : "Previous reactions: none recorded",
              assessment.patientSnapshot.measurements.length
                ? `Measurements: ${summarizeSnapshotRecords(assessment.patientSnapshot.measurements)}`
                : null,
            ].filter(Boolean).join(" · ") || "No historical context snapshot"}
          </p>
        </div>
        {assessment.newlyReportedReactions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Newly reported side effects
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {assessment.newlyReportedReactions.join(", ")}
            </p>
          </div>
        )}
        {Object.keys(patientSafety).length > 0 && (
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Patient-specific safety findings at assessment
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {safetyAlerts.length
                ? `Alerts: ${safetyAlerts.join(", ")}`
                : "No recorded patient-specific alerts"}
              {missingSafetyInformation.length
                ? ` · Missing information: ${missingSafetyInformation.join(", ")}`
                : ""}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

export default ReportCard;
