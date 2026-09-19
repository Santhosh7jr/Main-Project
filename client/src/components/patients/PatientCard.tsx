import { ChevronRight, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Patient } from "../../types/patient";

interface PatientCardProps {
  patient: Patient;
}

function PatientCard({ patient }: PatientCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/patients/${patient.id}`)}
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50">
            <UserRound className="h-5 w-5 text-blue-600" />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              {patient.name}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {patient.age} years • {patient.gender}
            </p>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-slate-400" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs text-slate-400">
            Blood Group
          </p>

          <p className="mt-1 text-sm font-medium text-slate-700">
            {patient.bloodGroup}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Conditions
          </p>

          <p className="mt-1 text-sm font-medium text-slate-700">
            {patient.conditions.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export default PatientCard;