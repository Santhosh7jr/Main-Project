import {
  ArrowLeft,
  Beaker,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  GitCompare,
  Pill,
  ShieldAlert,
  Tag,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import {
  getMedicineById,
} from "../services/medicineService";

import type {
  Medicine,
} from "../types/medicine";

function MedicineDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [medicine, setMedicine] =
    useState<Medicine | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadMedicine = async () => {
      if (!id) {
        setError("Medicine ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const result =
          await getMedicineById(
            Number(id)
          );

        setMedicine(result);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load medicine details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMedicine();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading medicine information...
          </p>
        </div>
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-red-500" />

          <h2 className="mt-4 text-lg font-semibold text-red-900">
            Medicine not found
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {error ||
              "The requested medicine could not be found."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/medicine-library")
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Medicine Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          to="/medicine-library"
          className="transition hover:text-blue-600"
        >
          Medicine Library
        </Link>

        <ChevronRight className="h-4 w-4" />

        <span className="font-medium text-slate-900">
          {medicine.name}
        </span>
      </div>


      {/* Header */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-6 py-8 lg:px-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Pill className="h-7 w-7 text-white" />
              </div>

              <div>
                <p className="text-sm font-medium text-blue-100">
                  Medicine Information
                </p>

                <h1 className="mt-1 text-3xl font-bold text-white">
                  {medicine.name}
                </h1>

                {medicine.genericName && (
                  <p className="mt-2 text-sm text-blue-100">
                    Generic name:{" "}
                    <span className="font-semibold text-white">
                      {medicine.genericName}
                    </span>
                  </p>
                )}
              </div>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  `/medicine-compare?medicine1=${medicine.id}`
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              <GitCompare className="h-4 w-4" />

              Compare Medicine
            </button>

          </div>
        </div>


        {/* Quick information */}
        <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-4 md:divide-x md:divide-y-0">

          <InfoBox
            icon={<Beaker className="h-5 w-5" />}
            label="Therapeutic Class"
            value={medicine.therapeuticClass}
          />

          <InfoBox
            icon={<FlaskConical className="h-5 w-5" />}
            label="Action Class"
            value={medicine.actionClass}
          />

          <InfoBox
            icon={<Tag className="h-5 w-5" />}
            label="Chemical Class"
            value={medicine.chemicalClass}
          />

          <InfoBox
            icon={<ShieldAlert className="h-5 w-5" />}
            label="Habit Forming"
            value={
              medicine.habitForming
                ? "Yes"
                : "No"
            }
          />

        </div>

      </section>


      {/* Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Uses */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Medical Uses
              </h2>

              <p className="text-sm text-slate-500">
                Documented uses associated with this medicine
              </p>
            </div>

          </div>


          <div className="mt-6">

            {medicine.uses.length === 0 ? (
              <EmptyState text="No documented uses available." />
            ) : (
              <div className="space-y-3">

                {medicine.uses.map(
                  (use, index) => (
                    <div
                      key={`${use}-${index}`}
                      className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />

                      <span className="text-sm text-slate-700">
                        {use}
                      </span>
                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </section>


        {/* Side effects */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Documented Side Effects
              </h2>

              <p className="text-sm text-slate-500">
                Side effects recorded in the MedGuard dataset
              </p>
            </div>

          </div>


          <div className="mt-6">

            {medicine.sideEffects.length === 0 ? (
              <EmptyState text="No documented side effects available." />
            ) : (
              <div className="space-y-3">

                {medicine.sideEffects.map(
                  (effect, index) => (
                    <div
                      key={`${effect}-${index}`}
                      className="flex items-start gap-3 rounded-xl bg-amber-50/60 p-3"
                    >
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />

                      <span className="text-sm text-slate-700">
                        {effect}
                      </span>
                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </section>

      </div>


      {/* Disclaimer */}
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

        <div className="flex gap-3">

          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

          <div>
            <h3 className="font-semibold text-blue-900">
              Clinical Information Notice
            </h3>

            <p className="mt-1 text-sm leading-6 text-blue-800">
              The information displayed here is based on
              the data available in MedGuard and is intended
              to support clinical review. It should not be
              treated as a substitute for professional
              medical judgment, prescribing guidelines, or
              patient-specific clinical assessment.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| Info box
|--------------------------------------------------------------------------
*/

function InfoBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="p-5">

      <div className="flex items-center gap-2 text-blue-600">
        {icon}

        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-slate-900">
        {value || "Not available"}
      </p>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| Empty state
|--------------------------------------------------------------------------
*/

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
      <p className="text-sm text-slate-500">
        {text}
      </p>
    </div>
  );
}

export default MedicineDetails;