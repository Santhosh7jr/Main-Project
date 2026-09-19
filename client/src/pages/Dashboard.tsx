import { useEffect, useState } from "react";

import {
  ClipboardCheck,
  Users,
  AlertTriangle,
  ShieldCheck,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import StatCard from "../components/dashboard/StatCard";
import RiskOverview from "../components/dashboard/RiskOverview";
import RecentAssessments from "../components/dashboard/RecentAssessments";

import { getReportSummary } from "../services/reportService";

import type { ReportSummary } from "../types/report";

function Dashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] =
    useState<ReportSummary | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getReportSummary();

        setSummary(data);
      } catch (err) {
        console.error(
          "Dashboard summary failed:",
          err
        );

        setError(
          "Unable to load live dashboard statistics."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>

          <h1 className="text-2xl font-bold text-slate-900">
            Good morning, Doctor
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Live overview of your patients and ADR assessments.
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/assessment")
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />

          New Assessment
        </button>

      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="flex min-h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2
            className="animate-spin text-blue-600"
          />
        </div>
      ) : (
        <>

          {/* STATISTICS */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Total Patients"
              value={
                summary?.totalPatients ?? 0
              }
              description="Patients in your records"
              icon={Users}
              iconBackground="bg-blue-50"
              iconColor="text-blue-600"
            />

            <StatCard
              title="Assessments"
              value={
                summary?.totalAssessments ?? 0
              }
              description="Saved ADR assessments"
              icon={ClipboardCheck}
              iconBackground="bg-indigo-50"
              iconColor="text-indigo-600"
            />

            <StatCard
              title="High Risk Cases"
              value={
                summary?.highRiskCases ?? 0
              }
              description="Model category requiring review"
              icon={AlertTriangle}
              iconBackground="bg-red-50"
              iconColor="text-red-600"
            />

            <StatCard
              title="Low Risk Cases"
              value={
                summary?.lowRiskCases ?? 0
              }
              description="Lowest model category"
              icon={ShieldCheck}
              iconBackground="bg-green-50"
              iconColor="text-green-600"
            />

          </div>

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

            <div className="xl:col-span-2">
              <RecentAssessments
                assessments={
                  summary?.recentAssessments ?? []
                }
              />
            </div>

            <RiskOverview
              distribution={
                summary?.riskDistribution ?? []
              }
            />

          </div>

        </>
      )}

      {/* QUICK ACTION */}
      <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-sm">

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

          <div>

            <h2 className="text-lg font-semibold">
              Start a new ADR assessment
            </h2>

            <p className="mt-1 max-w-xl text-sm text-blue-100">
              Analyze a medicine, review documented side effects,
              and generate AI-assisted ADR predictions.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/assessment")
            }
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            Start Assessment

            <ArrowRight className="h-4 w-4" />
          </button>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;