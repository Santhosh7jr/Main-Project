import { useEffect, useState } from "react";
import { Search, Pill, X, Loader2 } from "lucide-react";

import type { Medicine } from "../../types/assessment";
import { searchMedicines } from "../../services/medicineService";

interface MedicineSearchProps {
  selectedMedicine: Medicine | null;
  onSelect: (medicine: Medicine) => void;
  onClear: () => void;
}

const MedicineSearch = ({
  selectedMedicine,
  onSelect,
  onClear,
}: MedicineSearchProps) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        setResults([]);

        const data = await searchMedicines(query);

        if (!cancelled) {
          setResults(data);
        }
      } catch (error) {
        console.error("Medicine search failed:", error);

        if (!cancelled) {
          setResults([]);
          setError("Unable to search medicines. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search]);

  // --------------------------------------------------
  // SELECTED MEDICINE
  // --------------------------------------------------

  if (selectedMedicine) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Pill size={21} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {selectedMedicine.name}
                </h3>

                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  Selected
                </span>
              </div>

              <p className="mt-0.5 text-sm text-slate-500">
                {selectedMedicine.genericName ??
                  "Generic name unavailable"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            aria-label="Clear selected medicine"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <MedicineInfo
            label="Therapeutic Class"
            value={
              selectedMedicine.therapeuticClass ??
              "Not available"
            }
          />

          <MedicineInfo
            label="Action Class"
            value={
              selectedMedicine.actionClass ??
              "Not available"
            }
          />

          <MedicineInfo
            label="Chemical Class"
            value={
              selectedMedicine.chemicalClass ??
              "Not available"
            }
          />
        </div>

        {selectedMedicine.uses &&
          selectedMedicine.uses.length > 0 && (
            <div className="mt-3 rounded-lg bg-white p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Common Uses
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {selectedMedicine.uses
                  .slice(0, 5)
                  .map((use) => (
                    <span
                      key={use}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {use}
                    </span>
                  ))}
              </div>
            </div>
          )}
      </div>
    );
  }

  // --------------------------------------------------
  // SEARCH UI
  // --------------------------------------------------

  const hasSearch = search.trim().length > 0;

  return (
    <div>
      <div className="relative">
        <Search
          size={19}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicine by name or generic name..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-11 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
        />

        {loading && (
          <Loader2
            size={19}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-blue-500"
          />
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {hasSearch && (
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-6 text-sm text-slate-500">
              <Loader2
                size={17}
                className="animate-spin text-blue-500"
              />
              Searching medicines...
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {results.map((medicine) => (
                <button
                  key={medicine.id}
                  type="button"
                  onClick={() => {
                    onSelect(medicine);
                    setSearch("");
                    setResults([]);
                  }}
                  className="flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition last:border-0 hover:bg-blue-50/60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Pill size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {medicine.name}
                      </p>

                      {medicine.habitForming && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Habit forming
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {medicine.genericName ??
                        "Generic name unavailable"}
                    </p>

                    {medicine.therapeuticClass && (
                      <p className="mt-1.5 text-xs font-medium text-slate-400">
                        {medicine.therapeuticClass}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-5 py-7 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Search size={18} />
              </div>

              <p className="mt-3 text-sm font-medium text-slate-600">
                No medicines found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try a different medicine name or generic name.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --------------------------------------------------
// MEDICINE INFORMATION CARD
// --------------------------------------------------

interface MedicineInfoProps {
  label: string;
  value: string;
}

const MedicineInfo = ({
  label,
  value,
}: MedicineInfoProps) => {
  return (
    <div className="rounded-lg bg-white p-3.5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-medium leading-5 text-slate-700">
        {value}
      </p>
    </div>
  );
};

export default MedicineSearch;