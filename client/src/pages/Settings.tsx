import {
  ArrowLeft,
  BellOff,
  Database,
  ShieldCheck,
  Settings as SettingsIcon,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

function Settings() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Back */}
      <button
        type="button"
        onClick={() =>
          navigate("/dashboard")
        }
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
      >
        <ArrowLeft size={18} />

        Back to Dashboard
      </button>

      {/* Main Settings Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-6 sm:px-8">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <SettingsIcon size={24} />
            </div>

            <div>

              <h1 className="text-2xl font-bold text-slate-900">
                Settings
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage MedGuard application preferences.
              </p>

            </div>

          </div>

        </div>

        {/* Settings */}
        <div className="space-y-4 p-6 sm:p-8">

          {/* Patient Safety */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ShieldCheck size={20} />
              </div>

              <div>

                <h2 className="font-semibold text-slate-900">
                  Patient Safety Screening
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  MedGuard checks recorded allergies,
                  conditions, age, and current medications
                  during an assessment.
                </p>

              </div>

            </div>

            <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
              Active
            </span>

          </div>

          {/* Notifications */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <BellOff size={20} />
              </div>

              <div>

                <h2 className="font-semibold text-slate-900">
                  Notifications
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  In-app notification functionality is
                  currently disabled.
                </p>

              </div>

            </div>

            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              Disabled
            </span>

          </div>

          {/* Database */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Database size={20} />
              </div>

              <div>

                <h2 className="font-semibold text-slate-900">
                  Clinical Data
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Patient records, medicine information,
                  and assessment results are stored in the
                  MedGuard database.
                </p>

              </div>

            </div>

            <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              Connected
            </span>

          </div>

          {/* Application Information */}
          <div className="rounded-xl bg-slate-50 p-5">

            <h2 className="font-semibold text-slate-900">
              Application Information
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Application
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  MedGuard
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Purpose
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  ADR Clinical Decision Support Prototype
                </p>
              </div>

            </div>

          </div>

          {/* Disclaimer */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">

            <p className="text-sm font-semibold text-amber-900">
              Clinical Review Required
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              MedGuard is an academic clinical decision-support
              prototype. Model outputs are informational and
              should be reviewed by a qualified clinician.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Settings;