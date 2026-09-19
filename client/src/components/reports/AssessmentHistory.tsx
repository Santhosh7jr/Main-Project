import {
  FileText,
  Filter,
  Loader2,
  Search,
} from "lucide-react";

import ReportCard from "./ReportCard";

import type {
  ReportAssessment,
  RiskLevel,
} from "../../types/report";

export type RiskFilter =
  | "All"
  | RiskLevel;

interface AssessmentHistoryProps {
  reports: ReportAssessment[];
  totalCount: number;
  loading: boolean;
  error: string;
  search: string;
  riskFilter: RiskFilter;
  onSearchChange: (value: string) => void;
  onRiskFilterChange: (value: RiskFilter) => void;
}

const riskOptions: RiskFilter[] = [
  "All",
  "Low",
  "Moderate",
  "High",
];

function AssessmentHistory({
  reports,
  totalCount,
  loading,
  error,
  search,
  riskFilter,
  onSearchChange,
  onRiskFilterChange,
}: AssessmentHistoryProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                onSearchChange(
                  event.target.value
                )
              }
              placeholder="Search patient, medicine, or ADR"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter
              size={17}
              className="text-slate-400"
            />

            <div className="flex rounded-lg bg-slate-100 p-1">
              {riskOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    onRiskFilterChange(option)
                  }
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                    riskFilter === option
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-56 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2
              size={22}
              className="animate-spin"
            />
            <span className="text-sm font-medium">
              Loading reports...
            </span>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FileText size={22} />
          </div>

          <h3 className="font-semibold text-slate-800">
            No assessment reports found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {totalCount === 0
              ? "Run an ADR assessment to create the first report."
              : "Try another search or risk filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((assessment) => (
            <ReportCard
              key={assessment.id}
              assessment={assessment}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default AssessmentHistory;
