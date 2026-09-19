import {
  CheckCircle2,
  Pill,
  ShieldAlert,
} from "lucide-react";
import type { Medicine } from "../../types/assessment";

interface MedicineDetailsProps {
  medicine: Medicine;
}

const MedicineDetails = ({
  medicine,
}: MedicineDetailsProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Pill size={21} />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">
            {medicine.name}
          </h2>

          <p className="mt-0.5 text-sm text-slate-500">
            {medicine.genericName ??
              "Generic name unavailable"}
          </p>
        </div>
      </div>

      {/* Medicine information */}
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Detail
          label="Therapeutic Class"
          value={medicine.therapeuticClass}
        />

        <Detail
          label="Action Class"
          value={medicine.actionClass}
        />

        <Detail
          label="Chemical Class"
          value={medicine.chemicalClass}
        />

        <Detail
          label="Habit Forming"
          value={medicine.habitForming ? "Yes" : "No"}
          icon={
            medicine.habitForming ? (
              <ShieldAlert size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )
          }
        />
      </div>

      {/* Common uses */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Common Uses
        </p>

        {medicine.uses.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {medicine.uses.map((use) => (
              <span
                key={use}
                className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
              >
                {use}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No use information available.
          </p>
        )}
      </div>
    </div>
  );
};

interface DetailProps {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
}

const Detail = ({
  label,
  value,
  icon,
}: DetailProps) => {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
        {icon && (
          <span className="text-slate-400">
            {icon}
          </span>
        )}

        <span>
          {value || "Not available"}
        </span>
      </div>
    </div>
  );
};

export default MedicineDetails;