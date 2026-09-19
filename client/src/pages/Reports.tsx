import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  ShieldCheck,
} from "lucide-react";

import AssessmentHistory, {
  type RiskFilter,
} from "../components/reports/AssessmentHistory";

import StatCard from "../components/dashboard/StatCard";

import {
  getAssessmentReports,
} from "../services/reportService";

import type {
  ReportAssessment,
} from "../types/report";

function Reports() {
  const [reports, setReports] =
    useState<ReportAssessment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [searchParams] =
    useSearchParams();

  const [riskFilter, setRiskFilter] =
    useState<RiskFilter>("All");

  useEffect(() => {
    const initialSearch =
      searchParams.get("search");

    if (initialSearch !== null) {
      setSearch(initialSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getAssessmentReports();

        setReports(data);
      } catch (loadError) {
        console.error(
          "Failed to load reports:",
          loadError
        );

        setError(
          "Unable to load reports. Please check whether the backend server is running."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const filteredReports =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return reports.filter(
        (report) => {

          const matchesRisk =
            riskFilter === "All" ||
            report.riskLevel ===
              riskFilter;

          if (!matchesRisk) {
            return false;
          }

          if (!query) {
            return true;
          }

          const predictionText =
            (report.predictions ?? [])
              .map(
                (prediction) =>
                  prediction.adr
              )
              .join(" ")
              .toLowerCase();

          return (
            report.patientName
              .toLowerCase()
              .includes(query) ||
            report.medicineName
              .toLowerCase()
              .includes(query) ||
            predictionText.includes(
              query
            )
          );
        }
      );
    }, [
      reports,
      riskFilter,
      search,
    ]);

  const highRiskCount =
    reports.filter(
      (report) =>
        report.riskLevel === "High"
    ).length;

  const lowRiskCount =
    reports.filter(
      (report) =>
        report.riskLevel === "Low"
    ).length;

  return (
    <div className="min-h-full bg-slate-50">

      <div className="space-y-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <FileText size={22} />
            </div>

            <div>

              <h1 className="text-2xl font-bold text-slate-900">
                Reports
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Review assessment history and ADR model outputs.
              </p>

            </div>

          </div>

        </div>

        {/* STATISTICS */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

          <StatCard
            title="Total Reports"
            value={reports.length}
            description="Saved ADR assessments"
            icon={ClipboardCheck}
            iconBackground="bg-blue-50"
            iconColor="text-blue-600"
          />

          <StatCard
            title="High Risk"
            value={highRiskCount}
            description="Needs close review"
            icon={AlertTriangle}
            iconBackground="bg-red-50"
            iconColor="text-red-600"
          />

          <StatCard
            title="Low Risk"
            value={lowRiskCount}
            description="Lowest model category"
            icon={ShieldCheck}
            iconBackground="bg-green-50"
            iconColor="text-green-600"
          />

        </div>

        <AssessmentHistory
          reports={filteredReports}
          totalCount={reports.length}
          loading={loading}
          error={error}
          search={search}
          riskFilter={riskFilter}
          onSearchChange={
            setSearch
          }
          onRiskFilterChange={
            setRiskFilter
          }
        />

      </div>

    </div>
  );
}

export default Reports;