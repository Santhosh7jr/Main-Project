import { ChevronRight, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Patient } from "../../types/patient";

interface PatientTableProps {
  patients: Patient[];
}

function PatientTable({ patients }: PatientTableProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Patient
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Age / Gender
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Blood Group
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Conditions
              </th>

              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {patients.map((patient) => (
              <tr
                key={patient.id}
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="cursor-pointer transition hover:bg-slate-50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                      <UserRound className="h-4 w-4 text-blue-600" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {patient.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {patient.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {patient.age} / {patient.gender}
                </td>

                <td className="px-6 py-4">
                  <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                    {patient.bloodGroup}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {patient.conditions.length} condition
                  {patient.conditions.length !== 1 ? "s" : ""}
                </td>

                <td className="px-6 py-4 text-right">
                  <ChevronRight className="ml-auto h-5 w-5 text-slate-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PatientTable;