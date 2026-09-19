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
}

const PatientDetailsForm = ({
  patient,
  onPatientChange,
  patients,
}: PatientDetailsFormProps) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        Select Patient
      </label>

      <select
        value={patient?.id ?? ""}
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