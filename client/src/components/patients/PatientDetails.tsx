import { useState } from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Droplets,
  Mail,
  Phone,
  Pill,
  ShieldAlert,
  User,
} from "lucide-react";

import type {
  Patient,
} from "../../types/patient";

import type {
  PatientAssessmentHistory,
} from "../../types/patient";

interface PatientDetailsProps {
  patient: Patient;
}

const riskClass = {
  Low:
    "bg-green-50 text-green-700",

  Moderate:
    "bg-yellow-50 text-yellow-700",

  High:
    "bg-red-50 text-red-700",
};

function PatientDetails({
  patient,
}: PatientDetailsProps) {
  const navigate = useNavigate();

  const history: PatientAssessmentHistory[] =
    patient.assessmentHistory ?? [];

  const initials =
    patient.name
      .split(" ")
      .filter(Boolean)
      .map(
        (part) => part[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="min-h-full bg-slate-50 p-1">

      {/* HEADER */}

      <div className="mb-6 flex items-center justify-between gap-4">

        <button
          type="button"
          onClick={() =>
            navigate("/patients")
          }
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} />

          Back to Patients
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/assessment?patientId=${patient.id}`
            )
          }
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <ClipboardList size={18} />

          Start ADR Assessment
        </button>

      </div>

      {/* PATIENT HEADER */}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
              {initials}
            </div>

            <div>

              <h1 className="text-2xl font-bold text-slate-900">
                {patient.name}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Patient ID: P-
                {String(
                  patient.id
                ).padStart(4, "0")}
              </p>

            </div>

          </div>

          <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
            Active Patient
          </span>

        </div>

      </div>

      {/* MAIN GRID */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* LEFT */}

        <div className="space-y-6 xl:col-span-2">

          {/* BASIC INFO */}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <SectionTitle
              icon={<User size={20} />}
              title="Basic Information"
              subtitle="Personal and contact information"
              color="blue"
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <InfoItem
                label="Age"
                value={`${patient.age} years`}
              />

              <InfoItem
                label="Gender"
                value={patient.gender}
              />

              <InfoItem
                label="Blood Group"
                value={patient.bloodGroup}
                icon={
                  <Droplets size={16} />
                }
              />

              <InfoItem
                label="Phone"
                value={patient.phone}
                icon={
                  <Phone size={16} />
                }
              />

              <InfoItem
                label="Email"
                value={patient.email}
                icon={
                  <Mail size={16} />
                }
              />

              <InfoItem
                label="Patient Since"
                value={formatDate(
                  patient.createdAt
                )}
                icon={
                  <Calendar size={16} />
                }
              />

            </div>

          </section>

          {/* CONDITIONS */}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <SectionTitle
              icon={
                <ClipboardList size={20} />
              }
              title="Medical Conditions"
              subtitle="Known medical conditions"
              color="purple"
            />

            {patient.conditions.length ? (
              <div className="flex flex-wrap gap-2">

                {patient.conditions.map(
                  (condition) => (
                    <span
                      key={condition}
                      className="rounded-lg bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700"
                    >
                      {condition}
                    </span>
                  )
                )}

              </div>
            ) : (
              <EmptyState
                text="No medical conditions recorded."
              />
            )}

          </section>

          {/* MEDICATIONS */}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <SectionTitle
              icon={<Pill size={20} />}
              title="Current Medications"
              subtitle="Medications currently recorded"
              color="green"
            />

            {patient.medications.length ? (
              <div className="space-y-3">

                {patient.medications.map(
                  (medication) => (
                    <div
                      key={medication.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-green-600">
                        <Pill size={17} />
                      </div>

                      <div>

                        <p className="text-sm font-semibold text-slate-700">
                          {
                            medication.medicineName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {[
                            medication.dosage,
                            medication.frequency,
                          ]
                            .filter(Boolean)
                            .join(" • ") ||
                            "Dosage not recorded"}
                        </p>

                      </div>

                    </div>
                  )
                )}

              </div>
            ) : (
              <EmptyState
                text="No current medications recorded."
              />
            )}

          </section>

          {/* DYNAMIC ASSESSMENT HISTORY */}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <SectionTitle
              icon={
                <ShieldAlert size={20} />
              }
              title="ADR Assessment History"
              subtitle="Live assessment history for this patient"
              color="orange"
            />

            {history.length ? (
              <div className="space-y-4">
                {history.map((assessment) => (
                  <AssessmentHistoryCard
                    key={assessment.id}
                    assessment={assessment}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                text="No finalized ADR assessments recorded for this patient."
              />
            )}

          </section>

        </div>

        {/* RIGHT */}

        <div className="space-y-6">

          {/* ALLERGIES */}

          <section className="rounded-xl border border-red-100 bg-white p-6 shadow-sm">

            <SectionTitle
              icon={
                <ShieldAlert size={20} />
              }
              title="Allergies"
              subtitle="Known drug or substance allergies"
              color="red"
            />

            {patient.allergies.length ? (
              <div className="space-y-2">

                {patient.allergies.map(
                  (allergy) => (
                    <div
                      key={allergy}
                      className="rounded-lg border border-red-100 bg-red-50 p-3"
                    >

                      <div className="flex items-center gap-2">

                        <ShieldAlert
                          size={16}
                          className="text-red-600"
                        />

                        <span className="text-sm font-semibold text-red-700">
                          {allergy}
                        </span>

                      </div>

                    </div>
                  )
                )}

              </div>
            ) : (
              <EmptyState
                text="No known allergies recorded."
              />
            )}

          </section>

          {/* QUICK ACTIONS */}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Quick Actions
            </h2>

            <div className="space-y-3">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/assessment?patientId=${patient.id}`
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <ShieldAlert size={18} />

                New ADR Assessment
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/reports?search=${encodeURIComponent(
                      patient.name
                    )}`
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Calendar size={18} />

                View Full History
              </button>

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}


function AssessmentHistoryCard({
  assessment,
}: {
  assessment: PatientAssessmentHistory;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-slate-50"
      >
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">
            {assessment.medicineName}
          </p>

          {assessment.genericName && (
            <p className="mt-0.5 text-xs text-slate-500">
              {assessment.genericName}
            </p>
          )}

          <p className="mt-2 text-xs text-slate-400">
            {formatDate(assessment.createdAt)}
            {" • "}
            Assessment #{assessment.id}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            riskClass[assessment.riskLevel]
          }`}
        >
          {assessment.riskLevel}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <HistoryInfo
              label="Patient at assessment"
              value={`${assessment.patientAge} years • ${assessment.patientGender}`}
            />

            <HistoryInfo
              label="Model confidence"
              value={assessment.confidence.toFixed(3)}
            />

            <HistoryInfo
              label="Therapeutic class"
              value={
                assessment.therapeuticClass ||
                "Not available"
              }
            />

            <HistoryInfo
              label="Action class"
              value={
                assessment.actionClass ||
                "Not available"
              }
            />

            <HistoryInfo
              label="Chemical class"
              value={
                assessment.chemicalClass ||
                "Not available"
              }
            />

            <HistoryInfo
              label="Habit forming"
              value={
                assessment.habitForming
                  ? "Yes"
                  : "No"
              }
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <HistoryList
              label="Conditions at assessment"
              values={assessment.patientConditions}
            />

            <HistoryList
              label="Allergies at assessment"
              values={assessment.patientAllergies}
            />
          </div>

          <div className="mt-4 rounded-lg border border-orange-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
              Predicted adverse reactions
            </p>

            {assessment.predictions.length ? (
              <div className="mt-3 space-y-2">
                {assessment.predictions.map(
                  (prediction, index) => (
                    <div
                      key={`${prediction.adr}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <span className="text-sm text-slate-700">
                        {prediction.adr}
                      </span>

                      <span className="text-xs font-semibold text-slate-500">
                        {prediction.score == null
                          ? "N/A"
                          : prediction.score.toFixed(3)}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No predicted ADRs were recorded.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

function HistoryList({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      {values.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-500">
          None recorded
        </p>
      )}
    </div>
  );
}

/* ======================================================
   HELPERS
====================================================== */

interface SectionTitleProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
}

function SectionTitle({
  icon,
  title,
  subtitle,
  color,
}: SectionTitleProps) {
  const styles: Record<
    string,
    string
  > = {
    blue:
      "bg-blue-50 text-blue-600",

    purple:
      "bg-purple-50 text-purple-600",

    green:
      "bg-green-50 text-green-600",

    orange:
      "bg-orange-50 text-orange-600",

    red:
      "bg-red-50 text-red-600",
  };

  return (
    <div className="mb-5 flex items-center gap-3">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${styles[color]}`}
      >
        {icon}
      </div>

      <div>

        <h2 className="text-lg font-semibold text-slate-900">
          {title}
        </h2>

        <p className="text-sm text-slate-500">
          {subtitle}
        </p>

      </div>

    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
}

function InfoItem({
  label,
  value,
  icon,
}: InfoItemProps) {
  return (
    <div>

      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">

        {icon && (
          <span className="text-slate-400">
            {icon}
          </span>
        )}

        {value ||
          "Not available"}

      </div>

    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center">

      <p className="text-sm text-slate-500">
        {text}
      </p>

    </div>
  );
}

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default PatientDetails;