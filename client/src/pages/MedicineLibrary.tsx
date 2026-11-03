import {
  ArrowRight,
  Beaker,
  Loader2,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getAIMedicineEnrichment,
  searchMedicines,
} from "../services/medicineService";

import type {
  AIMedicineEnrichment,
  Medicine,
} from "../types/medicine";

import AIMedicineInfo from "../components/medicine/AIMedicineInfo";

function MedicineLibrary() {
  const navigate = useNavigate();

  const [search, setSearch] =
    useState("");

  const [medicines, setMedicines] =
    useState<Medicine[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [searched, setSearched] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const timer = setTimeout(
      async () => {
        const value = search.trim();

        if (!value) {
          setMedicines([]);
          setSearched(false);
          return;
        }

        try {
          setLoading(true);
          setError("");
          setSearched(true);

          const results =
            await searchMedicines(value);

          setMedicines(results);
        } catch (err) {
          console.error(err);

          setError(
            "Unable to search medicines."
          );
        } finally {
          setLoading(false);
        }
      },
      350
    );

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Header */}
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-8 shadow-sm lg:px-8">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Pill className="h-6 w-6 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">
              Medicine Library
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-100">
              Search the medicine dataset and review available details and
              known side effects recorded for each medicine.
            </p>
          </div>

        </div>

      </section>


      {/* Search */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="relative">

          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search medicine name or generic name..."
            className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />

        </div>

        <p className="mt-3 text-xs text-slate-500">
          Search by brand/medicine name or generic name.
        </p>

      </section>


      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
      )}


      {/* Results */}
      {!loading && medicines.length > 0 && (
        <section>

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Search Results
              </h2>

              <p className="text-sm text-slate-500">
                Showing up to 20 matches. Select the medicine record you want
                to review; similar results are not selected automatically.
              </p>
            </div>

          </div>


          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

            {medicines.map(
              (medicine) => (
                <MedicineCard
                  key={medicine.id}
                  medicine={medicine}
                  onClick={() =>
                    navigate(
                      `/medicines/${medicine.id}`
                    )
                  }
                />
              )
            )}

          </div>

        </section>
      )}


      {/* Empty */}
      {!loading &&
        searched &&
        medicines.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

            <Pill className="mx-auto h-10 w-10 text-slate-300" />

            <h3 className="mt-4 font-semibold text-slate-900">
              No medicines found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try a different medicine or generic name.
            </p>

          </div>
        )}


      {/* Initial state */}
      {!searched && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <Search className="h-7 w-7 text-blue-600" />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            Search the medicine database
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Enter a medicine name above to view its
            complete information and documented
            clinical data.
          </p>

        </div>
      )}

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| Medicine Card
|--------------------------------------------------------------------------
*/

function MedicineCard({
  medicine,
  onClick,
}: {
  medicine: Medicine;
  onClick: () => void;
}) {
  const [aiEnrichment, setAIEnrichment] =
    useState<AIMedicineEnrichment | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState("");

  const loadAIEnrichment = async () => {
    try {
      setAILoading(true);
      setAIError("");
      setAIEnrichment(
        await getAIMedicineEnrichment(medicine.id),
      );
    } catch (error) {
      console.error("Failed to load AI medicine information:", error);
      setAIError(
        error instanceof Error
          ? error.message
          : "Unable to load AI-generated medicine information.",
      );
    } finally {
      setAILoading(false);
    }
  };

  return (
    <article className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <button
        type="button"
        onClick={onClick}
        className="group w-full p-5 text-left"
      >

      <div className="flex items-start justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
          <Pill className="h-5 w-5 text-blue-600" />
        </div>

        <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />

      </div>


      <h3 className="mt-5 line-clamp-2 font-semibold text-slate-900">
        {medicine.name}
      </h3>


      {medicine.genericName && (
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
          {medicine.genericName}
        </p>
      )}


      <div className="mt-5 space-y-2">

        {medicine.therapeuticClass && (
          <div className="flex items-start gap-2 text-xs">

            <Beaker className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />

            <span className="line-clamp-2 text-slate-600">
              {medicine.therapeuticClass}
            </span>

          </div>
        )}


        <div className="flex items-center gap-2 text-xs">

          <ShieldCheck className="h-4 w-4 text-emerald-500" />

          <span className="text-slate-600">
            {medicine.habitForming === null
              ? "Habit-forming information unavailable"
              : medicine.habitForming
                ? "Habit forming"
                : "Not habit forming"}
          </span>

        </div>

      </div>

      </button>

      <div className="space-y-3 px-5 pb-5">
        {aiEnrichment && (
          <AIMedicineInfo
            medicineName={medicine.name}
            fields={aiEnrichment.fields}
          />
        )}

        {aiError && (
          <p role="alert" className="text-sm text-red-700">
            {aiError}
          </p>
        )}

        {!aiEnrichment && (
          <button
            type="button"
            onClick={loadAIEnrichment}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {aiLoading ? "Generating..." : "Get missing details with AI"}
          </button>
        )}
      </div>
    </article>
  );
}

export default MedicineLibrary;