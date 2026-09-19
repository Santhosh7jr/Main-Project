import {
  Activity,
  CalendarClock,
  Pill,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import type {
  ReportAssessment,
  RiskLevel,
} from "../../types/report";

interface ReportCardProps {
  assessment: ReportAssessment;
}

const riskStyles: Record<
  RiskLevel,
  string
> = {
  Low:
    "bg-green-50 text-green-700 border-green-200",

  Moderate:
    "bg-yellow-50 text-yellow-700 border-yellow-200",

  High:
    "bg-red-50 text-red-700 border-red-200",
};

const formatDate = (
  value: string
) => {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString();
};

function ReportCard({
  assessment,
}: ReportCardProps) {
  const navigate = useNavigate();

  const predictions =
    assessment.predictions ?? [];

  return (
    <article
      onClick={() =>
        navigate(
          `/patients/${assessment.patientId}`
        )
      }
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
    >

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

        <div className="min-w-0">

          <div className="flex flex-wrap items-center gap-2">

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assessment #{assessment.id}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${riskStyles[assessment.riskLevel]}`}
            >
              {assessment.riskLevel}
            </span>

          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">

            {/* PATIENT */}

            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <UserRound size={18} />
              </div>

              <div className="min-w-0">

                <p className="text-xs font-medium text-slate-400">
                  Patient
                </p>

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

                <p className="text-xs font-medium text-slate-400">
                  Medicine
                </p>

                <p className="truncate text-sm font-semibold text-slate-900">
                  {assessment.medicineName}
                </p>

              </div>

            </div>

          </div>

        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-96">

          <div className="rounded-lg bg-slate-50 px-4 py-3">

            <div className="flex items-center gap-2 text-slate-400">

              <Activity size={15} />

              <span className="text-xs font-medium">
                Confidence
              </span>

            </div>

            <p className="mt-1 font-bold text-slate-900">
              {Math.round(
                assessment.confidence *
                  100
              )}
              %
            </p>

          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-3">

            <p className="text-xs font-medium text-slate-400">
              Predicted ADRs
            </p>

            <p className="mt-1 font-bold text-slate-900">
              {assessment.adrCount}
            </p>

          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-3">

            <div className="flex items-center gap-2 text-slate-400">

              <CalendarClock size={15} />

              <span className="text-xs font-medium">
                Created
              </span>

            </div>

            <p className="mt-1 text-xs font-semibold text-slate-700">
              {formatDate(
                assessment.createdAt
              )}
            </p>

          </div>

        </div>

      </div>

      {/* PREDICTIONS */}

      {predictions.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">

          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Top Predictions
          </p>

          <div className="flex flex-wrap gap-2">

            {predictions
              .slice(0, 5)
              .map(
                (prediction) => (
                  <span
                    key={`${assessment.id}-${prediction.adr}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    {prediction.adr}
                  </span>
                )
              )}

          </div>

        </div>
      )}

    </article>
  );
}

export default ReportCard;