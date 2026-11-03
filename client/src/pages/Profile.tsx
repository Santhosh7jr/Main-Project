import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

function Profile() {
  const navigate = useNavigate();

  const { doctor } = useAuth();

  const doctorName =
    doctor?.name || "Doctor";

  const doctorEmail =
    doctor?.email || "Email not available";

  const doctorSpecialization =
    doctor?.specialization ||
    "Medical Professional";

  const initials =
    doctorName
      .split(" ")
      .filter(Boolean)
      .map(
        (part) => part.charAt(0)
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() || "DR";

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

      {/* Profile Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-8 sm:px-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

            {/* Avatar */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white/30 bg-white text-2xl font-bold text-blue-600 shadow-sm">
              {initials}
            </div>

            {/* Name */}
            <div className="text-white">

              <p className="text-sm font-medium text-blue-100">
                MedGuard Doctor Profile
              </p>

              <h1 className="mt-1 text-3xl font-bold">
                {doctorName}
              </h1>

              <p className="mt-1 text-sm text-blue-100">
                {doctorSpecialization}
              </p>

            </div>

          </div>

        </div>

        {/* Information */}
        <div className="p-6 sm:p-8">

          <h2 className="text-lg font-bold text-slate-900">
            Professional Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your MedGuard account information.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {/* Name */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <UserCircle size={20} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Full Name
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {doctorName}
                  </p>
                </div>

              </div>

            </div>

            {/* Email */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Mail size={20} />
                </div>

                <div className="min-w-0">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Email
                  </p>

                  <p className="mt-1 truncate font-semibold text-slate-900">
                    {doctorEmail}
                  </p>

                </div>

              </div>

            </div>

            {/* Specialization */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <Stethoscope size={20} />
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Specialization
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {doctorSpecialization}
                  </p>

                </div>

              </div>

            </div>

            {/* Account */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <ShieldCheck size={20} />
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Account Status
                  </p>

                  <p className="mt-1 font-semibold text-green-700">
                    Active
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={() =>
                navigate("/settings")
              }
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Open Settings
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Return to Dashboard
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Profile;