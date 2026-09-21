import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Pill,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import {
  compareMedicines,
  getMedicineById,
  searchMedicines,
} from "../services/medicineService.js";

import type {
  Medicine,
  MedicineComparison,
  ComparisonList,
} from "../types/medicine.js";

// ============================================================
// Empty comparison list
// ============================================================

const EMPTY_LIST: ComparisonList = {
  shared: [],
  medicine1Only: [],
  medicine2Only: [],
};

// ============================================================
// Medicine Search
// ============================================================

interface MedicineSearchProps {
  label: string;
  medicine: Medicine | null;
  excludeId?: number;
  onSelect: (
    medicine: Medicine
  ) => void;
  onClear: () => void;
}

function MedicineSearch({
  label,
  medicine,
  excludeId,
  onSelect,
  onClear,
}: MedicineSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] =
    useState<Medicine[]>([]);
  const [loading, setLoading] =
    useState(false);
  const [open, setOpen] =
    useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(
      async () => {
        try {
          setLoading(true);

          const medicines =
            await searchMedicines(
              query.trim()
            );

          setResults(
            medicines.filter(
              (item) =>
                item.id !== excludeId
            )
          );

          setOpen(true);
        } catch (error) {
          console.error(
            "Medicine search error:",
            error
          );

          setResults([]);
        } finally {
          setLoading(false);
        }
      },
      300
    );

    return () =>
      clearTimeout(timer);
  }, [query, excludeId]);

  if (medicine) {
    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </label>

        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Pill className="h-5 w-5 text-blue-600" />
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">
                {medicine.name}
              </p>

              {medicine.genericName && (
                <p className="truncate text-xs text-slate-500">
                  {medicine.genericName}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

        <input
          value={query}
          onChange={(event) => {
            setQuery(
              event.target.value
            );
            setOpen(true);
          }}
          placeholder="Search medicine..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {loading && (
          <div className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        )}
      </div>

      {open &&
        query.trim() &&
        !loading && (
          <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            {results.length > 0 ? (
              results.map(
                (medicine) => (
                  <button
                    key={medicine.id}
                    type="button"
                    onClick={() => {
                      onSelect(
                        medicine
                      );
                      setQuery("");
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 border-b border-slate-100 p-4 text-left hover:bg-slate-50"
                  >
                    <Pill className="h-5 w-5 shrink-0 text-blue-600" />

                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {medicine.name}
                      </p>

                      {medicine.genericName && (
                        <p className="truncate text-xs text-slate-500">
                          {
                            medicine.genericName
                          }
                        </p>
                      )}
                    </div>
                  </button>
                )
              )
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                No medicines found.
              </div>
            )}
          </div>
        )}
    </div>
  );
}

// ============================================================
// Comparison List
// ============================================================

interface ComparisonListProps {
  title: string;
  data: ComparisonList;
  medicine1Name: string;
  medicine2Name: string;
}

function ComparisonListSection({
  title,
  data,
  medicine1Name,
  medicine2Name,
}: ComparisonListProps) {
  const [open, setOpen] =
    useState(true);

  const safeData = data ?? EMPTY_LIST;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        className="flex w-full items-center justify-between px-6 py-5"
      >
        <h3 className="text-lg font-semibold text-slate-900">
          {title}
        </h3>

        {open ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-6">
          {safeData.shared.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />

                <h4 className="font-medium text-slate-800">
                  Shared
                </h4>
              </div>

              <div className="flex flex-wrap gap-2">
                {safeData.shared.map(
                  (item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="rounded-full bg-green-50 px-3 py-1.5 text-sm text-green-700"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {safeData.medicine1Only
            .length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3 font-medium text-blue-700">
                Only in {medicine1Name}
              </h4>

              <div className="flex flex-wrap gap-2">
                {safeData.medicine1Only.map(
                  (item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {safeData.medicine2Only
            .length > 0 && (
            <div>
              <h4 className="mb-3 font-medium text-purple-700">
                Only in {medicine2Name}
              </h4>

              <div className="flex flex-wrap gap-2">
                {safeData.medicine2Only.map(
                  (item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="rounded-full bg-purple-50 px-3 py-1.5 text-sm text-purple-700"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {safeData.shared.length === 0 &&
            safeData.medicine1Only.length === 0 &&
            safeData.medicine2Only.length === 0 && (
              <p className="text-sm text-slate-500">
                No comparison data available.
              </p>
            )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function MedicineCompare() {
  const [searchParams] = useSearchParams();
  const [medicine1, setMedicine1] =
    useState<Medicine | null>(null);

  const [medicine2, setMedicine2] =
    useState<Medicine | null>(null);

  const [comparison, setComparison] =
    useState<MedicineComparison | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // Load a comparison pair passed from the assessment page.
  useEffect(() => {
    const firstId = Number(searchParams.get("medicine1"));
    const secondId = Number(searchParams.get("medicine2"));

    if (!Number.isInteger(firstId) || !Number.isInteger(secondId) || firstId <= 0 || secondId <= 0 || firstId === secondId) {
      return;
    }

    let cancelled = false;

    const loadComparisonPair = async () => {
      try {
        setLoading(true);
        setError(null);
        const [first, second] = await Promise.all([
          getMedicineById(firstId),
          getMedicineById(secondId),
        ]);
        if (cancelled) return;
        setMedicine1(first);
        setMedicine2(second);
        setComparison(null);
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Failed to load medicines for comparison.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadComparisonPair();
    return () => { cancelled = true; };
  }, [searchParams]);

  // ==========================================================
  // Compare
  // ==========================================================

  const handleCompare = async () => {
    if (!medicine1 || !medicine2) {
      setError(
        "Please select two medicines."
      );
      return;
    }

    if (
      medicine1.id === medicine2.id
    ) {
      setError(
        "Please select two different medicines."
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setComparison(null);

      const result =
        await compareMedicines(
          medicine1.id,
          medicine2.id
        );

      console.log(
        "Comparison result:",
        result
      );

      setComparison(result);
    } catch (error) {
      console.error(
        "Comparison error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to compare medicines."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // Swap
  // ==========================================================

  const handleSwap = () => {
    const first = medicine1;

    setMedicine1(medicine2);
    setMedicine2(first);

    setComparison(null);
    setError(null);
  };

  // ==========================================================
  // Reset
  // ==========================================================

  const handleReset = () => {
    setMedicine1(null);
    setMedicine2(null);
    setComparison(null);
    setError(null);
  };

  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Compare Medicines
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Compare properties, medical uses,
            and documented side effects.
          </p>
        </div>

        {/* Medicine selection */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_auto_1fr] md:items-end">

            <MedicineSearch
              label="Medicine 1"
              medicine={medicine1}
              excludeId={
                medicine2?.id
              }
              onSelect={setMedicine1}
              onClear={() =>
                setMedicine1(null)
              }
            />

            <button
              type="button"
              onClick={handleSwap}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              <ArrowLeftRight className="h-5 w-5 text-slate-600" />
            </button>

            <MedicineSearch
              label="Medicine 2"
              medicine={medicine2}
              excludeId={
                medicine1?.id
              }
              onSelect={setMedicine2}
              onClear={() =>
                setMedicine2(null)
              }
            />
          </div>

          {error && (
            <div className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />

              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={handleCompare}
              disabled={
                !medicine1 ||
                !medicine2 ||
                loading
              }
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Comparing..."
                : "Compare Medicines"}
            </button>
          </div>
        </div>

        {/* Result */}

        {comparison && (
          <div className="mt-8 space-y-6">

            {/* Medicine cards */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <p className="mb-2 text-xs font-semibold uppercase text-blue-600">
                  Medicine 1
                </p>

                <h2 className="text-xl font-bold text-slate-900">
                  {comparison.medicine1.name}
                </h2>

                {comparison.medicine1.genericName && (
                  <p className="mt-1 text-sm text-slate-500">
                    {
                      comparison
                        .medicine1
                        .genericName
                    }
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-6">
                <p className="mb-2 text-xs font-semibold uppercase text-purple-600">
                  Medicine 2
                </p>

                <h2 className="text-xl font-bold text-slate-900">
                  {comparison.medicine2.name}
                </h2>

                {comparison.medicine2.genericName && (
                  <p className="mt-1 text-sm text-slate-500">
                    {
                      comparison
                        .medicine2
                        .genericName
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Properties */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                <FlaskConical className="h-5 w-5 text-blue-600" />

                <h3 className="text-lg font-semibold text-slate-900">
                  Medicine Properties
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {comparison.differentFields?.map(
                  (field) => (
                    <div
                      key={field.field}
                      className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-3"
                    >
                      <div className="font-medium text-slate-600">
                        {field.label}
                      </div>

                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="mb-1 text-xs font-medium text-blue-600">
                          {
                            comparison
                              .medicine1
                              .name
                          }
                        </p>

                        <p className="text-sm text-slate-800">
                          {formatValue(
                            field.medicine1
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg bg-purple-50 p-3">
                        <p className="mb-1 text-xs font-medium text-purple-600">
                          {
                            comparison
                              .medicine2
                              .name
                          }
                        </p>

                        <p className="text-sm text-slate-800">
                          {formatValue(
                            field.medicine2
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )}

                {comparison.sameFields?.map(
                  (field) => (
                    <div
                      key={field.field}
                      className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-3"
                    >
                      <div className="font-medium text-slate-600">
                        {field.label}
                      </div>

                      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 md:col-span-2">
                        <Check className="h-4 w-4 text-green-600" />

                        <span className="text-sm text-green-700">
                          Same:{" "}
                          {formatValue(
                            field.value
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}

                {(!comparison.sameFields ||
                  comparison.sameFields.length === 0) &&
                  (!comparison.differentFields ||
                    comparison.differentFields.length === 0) && (
                    <div className="p-8 text-center text-sm text-slate-500">
                      No property comparison data available.
                    </div>
                  )}
              </div>
            </div>

            {/* Uses */}

            <ComparisonListSection
              title="Medical Uses"
              data={
                comparison.uses ??
                EMPTY_LIST
              }
              medicine1Name={
                comparison
                  .medicine1.name
              }
              medicine2Name={
                comparison
                  .medicine2.name
              }
            />

            {/* Side effects */}

            <ComparisonListSection
              title="Side Effects"
              data={
                comparison.sideEffects ??
                EMPTY_LIST
              }
              medicine1Name={
                comparison
                  .medicine1.name
              }
              medicine2Name={
                comparison
                  .medicine2.name
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Format value
// ============================================================

function formatValue(
  value:
    | string
    | boolean
    | null
    | undefined
): string {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "Not available";
  }

  if (
    typeof value === "boolean"
  ) {
    return value
      ? "Yes"
      : "No";
  }

  return String(value);
}