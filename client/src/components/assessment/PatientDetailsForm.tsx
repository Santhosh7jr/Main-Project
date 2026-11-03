import {
  AlertTriangle,
  Calendar,
  HeartPulse,
  User,
} from "lucide-react";
import type { AssessmentPatient } from "../../types/assessment";

interface PatientDetailsFormProps {
  patient: AssessmentPatient | null;
  onPatientChange: (patient: AssessmentPatient | null) => void;
  patients: AssessmentPatient[];
  disabled?: boolean;
}

const PatientDetailsForm = ({
  patient,
  onPatientChange,
  patients,
  disabled = false,
}: PatientDetailsFormProps) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        Select Patient
      </label>

      <p className="mb-3 text-xs leading-5 text-slate-500">
        Patient information supports a separate safety review. The ADR model
        uses medicine features only, so these details do not personalize its
        predictions.
      </p>

      {patients.length === 0 && (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No patient records are available. Add a patient before running an assessment.
        </p>
      )}

      <select
        value={patient?.id ?? ""}
        disabled={disabled || patients.length === 0}
        onChange={(e) => {
          const selected = patients.find(
            (item) => item.id === Number(e.target.value)
          );

          onPatientChange(selected ?? null);
        }}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">Select a patient</option>

        {patients.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} — {item.age} years
          </option>
        ))}
      </select>

      {patient && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User size={20} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                {patient.name}
              </h3>

              <p className="text-sm text-slate-500">
                {patient.age} years • {patient.gender}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <RiskItem
              icon={<HeartPulse size={17} />}
              label="Conditions"
              value={
                patient.conditions.length > 0
                  ? patient.conditions.join(", ")
                  : "None recorded"
              }
            />

            <RiskItem
              icon={<AlertTriangle size={17} />}
              label="Allergies"
              value={
                patient.allergies.length > 0
                  ? patient.allergies.join(", ")
                  : "No known allergies"
              }
              danger={patient.allergies.length > 0}
            />

            <RiskItem
              icon={<Calendar size={17} />}
              label="Current Medicines"
              value={
                patient.medications.length > 0
                  ? patient.medications.join(", ")
                  : "None recorded"
              }
            />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Previous medicines
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {patient.previousMedications?.length
                  ? patient.previousMedications
                      .map((item) => item.medicineName)
                      .join(", ")
                  : "No previous medicines recorded"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Previous adverse reactions
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {patient.adverseReactions?.length
                  ? patient.adverseReactions
                      .map(
                        (item) =>
                          `${item.reaction} (${item.suspectedMedicine}; ${item.verificationStatus.replaceAll("_", " ")})`,
                      )
                      .join("; ")
                  : "No previous reactions recorded"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface RiskItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  danger?: boolean;
}

const RiskItem = ({
  icon,
  label,
  value,
  danger = false,
}: RiskItemProps) => {
  return (
    <div
      className={`rounded-lg border p-4 ${
        danger
          ? "border-red-100 bg-red-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={
            danger ? "text-red-600" : "text-slate-400"
          }
        >
          {icon}
        </span>

        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>

      <p
        className={`mt-2 text-sm font-medium ${
          danger ? "text-red-700" : "text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
};

export default PatientDetailsForm;