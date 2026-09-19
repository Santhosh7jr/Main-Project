import {
  ArrowRight,
  CircleAlert,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import type {
  ReportAssessment,
} from "../../types/report";

interface RecentAssessmentsProps {
  assessments: ReportAssessment[];
}

const riskStyles = {
  Low: "bg-green-50 text-green-700",
  Moderate:
    "bg-yellow-50 text-yellow-700",
  High:
    "bg-red-50 text-red-700",
};

function RecentAssessments({
  assessments,
}: RecentAssessmentsProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="flex items-center justify-between border-b border-slate-200 p-6">

        <div>

          <h2 className="text-lg font-semibold text-slate-900">
            Recent Assessments
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest saved ADR assessments
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/reports")
          }
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View all

          <ArrowRight className="h-4 w-4" />
        </button>

      </div>

      {assessments.length === 0 ? (
        <div className="p-8 text-center">

          <p className="text-sm font-medium text-slate-600">
            No assessments yet.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/assessment")
            }
            className="mt-3 text-sm font-semibold text-blue-600"
          >
            Create your first assessment
          </button>

        </div>
      ) : (
        <div className="divide-y divide-slate-100">

          {assessments.map(
            (assessment) => (
              <button
                key={assessment.id}
                type="button"
                onClick={() =>
                  navigate(
                    `/patients/${assessment.patientId}`
                  )
                }
                className="flex w-full items-center justify-between p-5 text-left transition hover:bg-slate-50"
              >

                <div className="flex items-center gap-4">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <CircleAlert className="h-5 w-5 text-slate-500" />
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-slate-900">
                      {assessment.patientName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {assessment.medicineName}
                      {" • "}
                      {new Date(
                        assessment.createdAt
                      ).toLocaleString()}
                    </p>

                  </div>

                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${riskStyles[assessment.riskLevel]}`}
                >
                  {assessment.riskLevel}
                </span>

              </button>
            )
          )}

        </div>
      )}

    </div>
  );
}

export default RecentAssessments;