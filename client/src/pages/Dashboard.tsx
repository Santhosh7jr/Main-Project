import { useEffect, useState } from "react";
import { Activity, ClipboardCheck, Pill, Plus, Users, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/dashboard/StatCard";
import RecentAssessments from "../components/dashboard/RecentAssessments";
import { getReportSummary } from "../services/reportService";
import type { ReportSummary } from "../types/report";

function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        setSummary(await getReportSummary());
      } catch (err) {
        console.error("Dashboard summary failed:", err);
        setError("Unable to load live dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good morning, Doctor</h1>
          <p className="mt-1 text-sm text-slate-500">A clear overview of your patients, medicine reviews, and clinical activity.</p>
        </div>
        <button type="button" onClick={() => navigate("/assessment")} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <Plus className="h-5 w-5" /> New Assessment
        </button>
      </div>

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">{error}</div>}

      {loading ? (
        <div className="flex min-h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Patients" value={summary?.totalPatients ?? 0} description="Patients in your records" icon={Users} iconBackground="bg-blue-50" iconColor="text-blue-600" />
            <StatCard title="Finalized Assessments" value={summary?.totalAssessments ?? 0} description="Assessments saved to history" icon={ClipboardCheck} iconBackground="bg-indigo-50" iconColor="text-indigo-600" />
            <StatCard title="Medicines Reviewed" value={summary?.medicinesReviewed ?? 0} description="Distinct medicines used in finalized assessments" icon={Pill} iconBackground="bg-purple-50" iconColor="text-purple-600" />
            <StatCard title="ADRs Identified" value={summary?.adrsIdentified ?? 0} description="Predicted ADR records across saved assessments" icon={Activity} iconBackground="bg-amber-50" iconColor="text-amber-600" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2"><RecentAssessments assessments={summary?.recentAssessments ?? []} /></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Activity className="h-6 w-6" /></div>
              <h2 className="mt-5 text-lg font-semibold text-slate-900">This week's activity</h2>
              <p className="mt-1 text-sm text-slate-500">Finalized assessments during the last 7 days.</p>
              <p className="mt-5 text-4xl font-bold text-slate-900">{summary?.assessmentsThisWeek ?? 0}</p>
              <p className="mt-1 text-sm text-slate-500">assessments completed</p>
              <button type="button" onClick={() => navigate("/reports")} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">Open reports <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="text-lg font-semibold text-blue-950">Medicine decision workflow</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-900/80">Use the assessment page to review predicted adverse reactions, documented side effects, patient-specific safety alerts, and potential medicine alternatives. Exploratory reviews are not added to patient history until a medicine is explicitly selected and saved.</p>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
