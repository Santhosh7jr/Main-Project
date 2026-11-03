import { ArrowRight, ClipboardCheck, Pill } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ReportAssessment } from "../../types/report";

interface RecentAssessmentsProps {
  assessments: ReportAssessment[];
}

function RecentAssessments({ assessments }: RecentAssessmentsProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent Clinical Activity</h2>
          <p className="mt-1 text-sm text-slate-500">Recently finalized medicine assessments</p>
        </div>
        <button type="button" onClick={() => navigate("/reports")} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
          View reports <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="p-8 text-center">
          <ClipboardCheck className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No finalized assessments yet.</p>
          <button type="button" onClick={() => navigate("/assessment")} className="mt-3 text-sm font-semibold text-blue-600">Start an assessment</button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {assessments.map((assessment) => (
            <button key={assessment.id} type="button" onClick={() => navigate(`/patients/${assessment.patientId}`)} className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50"><Pill className="h-5 w-5 text-blue-600" /></div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{assessment.medicineName}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">Patient: {assessment.patientName}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(assessment.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-right">
                <p className="text-xs text-slate-400">Predicted ADRs</p>
                <p className="text-sm font-bold text-slate-800">{assessment.adrCount}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentAssessments;
