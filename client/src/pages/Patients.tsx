import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserRound,
  X,
  Loader2,
} from "lucide-react";

import {
  getPatients,
} from "../services/patientService.js";

import type { Patient } from "../types/patient.js";

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // Load patients
  // ============================================================

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getPatients();

        setPatients(data);
      } catch (err) {
        console.error("Failed to load patients:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load patients."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // ============================================================
  // Search / Filter
  // ============================================================

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    // Show everyone when search is empty
    if (!query) {
      return patients;
    }

    return patients.filter((patient) => {
      const name =
        String(patient.name ?? "").toLowerCase();

      const patientId =
        String(patient.id ?? "").toLowerCase();

      const gender =
        String(patient.gender ?? "").toLowerCase();

      const age =
        String(patient.age ?? "").toLowerCase();

      const phone =
        String(patient.phone ?? "").toLowerCase();

      return (
        name.includes(query) ||
        patientId.includes(query) ||
        gender.includes(query) ||
        age.includes(query) ||
        phone.includes(query)
      );
    });
  }, [patients, searchTerm]);

  // ============================================================
  // Clear search
  // ============================================================

  const clearSearch = () => {
    setSearchTerm("");
  };

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading patients...</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // Error
  // ============================================================

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-medium text-red-700">
          {error}
        </p>
      </div>
    );
  }

  // ============================================================
  // Page
  // ============================================================

  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* ================================================== */}
        {/* Header */}
        {/* ================================================== */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Patients
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage and view patient records.
          </p>
        </div>

        {/* ================================================== */}
        {/* Search */}
        {/* ================================================== */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search patients by name, ID, age, gender or phone..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search result count */}

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {searchTerm.trim()
                ? `${filteredPatients.length} patient${
                    filteredPatients.length === 1
                      ? ""
                      : "s"
                  } found`
                : `${patients.length} patient${
                    patients.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>

            {searchTerm.trim() && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* ================================================== */}
        {/* No patients */}
        {/* ================================================== */}

        {patients.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <UserRound className="h-7 w-7 text-slate-400" />
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              No patients found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              There are currently no patient records.
            </p>
          </div>
        )}

        {/* ================================================== */}
        {/* Search returned nothing */}
        {/* ================================================== */}

        {patients.length > 0 &&
          filteredPatients.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Search className="h-7 w-7 text-slate-400" />
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                No matching patients
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                No patient matches "
                <span className="font-medium text-slate-700">
                  {searchTerm}
                </span>
                ".
              </p>

              <button
                type="button"
                onClick={clearSearch}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Clear Search
              </button>
            </div>
          )}

        {/* ================================================== */}
        {/* Patient table */}
        {/* ================================================== */}

        {filteredPatients.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Patient
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      ID
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Age
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Gender
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* Patient */}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                            <UserRound className="h-5 w-5 text-blue-600" />
                          </div>

                          <div>
                            <p className="font-medium text-slate-900">
                              {patient.name || "Unknown"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ID */}

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {patient.id}
                      </td>

                      {/* Age */}

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {patient.age ?? "—"}
                      </td>

                      {/* Gender */}

                      <td className="px-6 py-4 text-sm capitalize text-slate-600">
                        {patient.gender || "—"}
                      </td>

                      {/* Phone */}

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {patient.phone || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}