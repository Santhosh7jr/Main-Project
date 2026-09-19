import { useEffect, useState } from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Loader2,
  Search,
  UserCircle,
  Users,
  Pill,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

import { getPatients } from "../../services/patientService";
import { searchMedicines } from "../../services/medicineService";

import type { Patient } from "../../types/patient";
import type { Medicine } from "../../types/assessment";

function Topbar() {
  const navigate = useNavigate();

  const { doctor } = useAuth();

  const [query, setQuery] = useState("");

  const [patients, setPatients] =
    useState<Patient[]>([]);

  const [medicines, setMedicines] =
    useState<Medicine[]>([]);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    const value = query.trim();

    if (!value) {
      setPatients([]);
      setMedicines([]);
      setLoading(false);

      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(
      async () => {
        try {
          setLoading(true);

          const [
            patientResult,
            medicineResult,
          ] = await Promise.all([
            getPatients(),
            searchMedicines(value),
          ]);

          if (cancelled) {
            return;
          }

          const normalized =
            value.toLowerCase();

          const matchingPatients =
            patientResult
              .filter((patient) =>
                [
                  patient.name,
                  patient.email ?? "",
                  patient.phone ?? "",
                ]
                  .join(" ")
                  .toLowerCase()
                  .includes(normalized)
              )
              .slice(0, 5);

          setPatients(
            matchingPatients
          );

          setMedicines(
            medicineResult.slice(0, 5)
          );
        } catch (error) {
          console.error(
            "Global search failed:",
            error
          );

          if (!cancelled) {
            setPatients([]);
            setMedicines([]);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      },
      300
    );

    return () => {
      cancelled = true;

      window.clearTimeout(timer);
    };
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setPatients([]);
    setMedicines([]);
  };

  const goToPatient = (
    patientId: number
  ) => {
    clearSearch();

    navigate(
      `/patients/${patientId}`
    );
  };

  const goToMedicine = (
    medicineId: number
  ) => {
    clearSearch();

    navigate(
      `/assessment?medicineId=${medicineId}`
    );
  };

  return (
    <header className="fixed left-64 right-0 top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">

      {/* Global Search */}
      <div className="relative w-full max-w-xl">

        <Search
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
        />

        <input
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              query.trim()
            ) {
              navigate(
                `/patients?search=${encodeURIComponent(
                  query.trim()
                )}`
              );

              clearSearch();
            }
          }}
          placeholder="Search patients or medicines..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
        />

        {loading && (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500"
          />
        )}

        {/* Search Results */}
        {query.trim() &&
          !loading &&
          (patients.length > 0 ||
            medicines.length > 0) && (
            <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

              {/* Patients */}
              {patients.length > 0 && (
                <div className="border-b border-slate-100 p-2">

                  <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Patients
                  </p>

                  {patients.map(
                    (patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() =>
                          goToPatient(
                            patient.id
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-blue-50"
                      >
                        <Users
                          size={17}
                          className="text-blue-600"
                        />

                        <span className="text-sm font-medium text-slate-800">
                          {patient.name}
                        </span>
                      </button>
                    )
                  )}

                </div>
              )}

              {/* Medicines */}
              {medicines.length > 0 && (
                <div className="p-2">

                  <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Medicines
                  </p>

                  {medicines.map(
                    (medicine) => (
                      <button
                        key={medicine.id}
                        type="button"
                        onClick={() =>
                          goToMedicine(
                            medicine.id
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-emerald-50"
                      >
                        <Pill
                          size={17}
                          className="text-emerald-600"
                        />

                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {medicine.name}
                          </p>

                          {medicine.genericName && (
                            <p className="text-xs text-slate-400">
                              {
                                medicine.genericName
                              }
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  )}

                </div>
              )}

            </div>
          )}

      </div>

      {/* Doctor Profile */}
      <button
        type="button"
        onClick={() =>
          navigate("/profile")
        }
        className="ml-6 flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-50"
      >
        <UserCircle className="h-9 w-9 text-slate-400" />

        <div className="hidden sm:block">

          <p className="text-sm font-semibold text-slate-900">
            {doctor?.name || "Doctor"}
          </p>

          <p className="text-xs text-slate-500">
            {doctor?.specialization ||
              "Medical Professional"}
          </p>

        </div>
      </button>

    </header>
  );
}

export default Topbar;