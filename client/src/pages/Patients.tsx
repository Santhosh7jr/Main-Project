import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  Search,
  UserRound,
  X,
  Loader2,
  Plus,
  Phone,
  Mail,
  Calendar,
  Pill,
  HeartPulse,
  AlertCircle,
  Droplets,
} from "lucide-react";

import {
  getPatients,
  getPatientById,
  createPatient,
} from "../services/patientService.js";

import type { Patient } from "../types/patient.js";

export default function Patients() {
  const [patients, setPatients] =
    useState<Patient[]>([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  // ============================================================
  // Add Patient
  // ============================================================

  const [showAddPatient, setShowAddPatient] =
    useState(false);

  const [addingPatient, setAddingPatient] =
    useState(false);

  const [addPatientError, setAddPatientError] =
    useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender:
      "Male" as
        | "Male"
        | "Female"
        | "Other",
    phone: "",
    email: "",
    bloodGroup: "",
    conditions: "",
    allergies: "",
  });

  // ============================================================
  // Patient Details
  // ============================================================

  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);

  const [loadingPatientDetails, setLoadingPatientDetails] =
    useState(false);

  const [patientDetailsError, setPatientDetailsError] =
    useState<string | null>(null);

  // ============================================================
  // Load Patients
  // ============================================================

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getPatients();

      setPatients(data);
    } catch (err) {
      console.error(
        "Failed to load patients:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load patients.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // ============================================================
  // Search / Filter
  // ============================================================

  const filteredPatients = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

    if (!query) {
      return patients;
    }

    return patients.filter((patient) => {
      const name =
        String(
          patient.name ?? "",
        ).toLowerCase();

      const patientId =
        String(
          patient.id ?? "",
        ).toLowerCase();

      const gender =
        String(
          patient.gender ?? "",
        ).toLowerCase();

      const age =
        String(
          patient.age ?? "",
        ).toLowerCase();

      const phone =
        String(
          patient.phone ?? "",
        ).toLowerCase();

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
  // Clear Search
  // ============================================================

  const clearSearch = () => {
    setSearchTerm("");
  };

  // ============================================================
  // Open Patient Details
  // ============================================================

  const handlePatientClick = async (
    patientId: number,
  ) => {
    try {
      setLoadingPatientDetails(true);
      setPatientDetailsError(null);
      setSelectedPatient(null);

      const patient =
        await getPatientById(
          patientId,
        );

      setSelectedPatient(patient);
    } catch (err) {
      console.error(
        "Failed to load patient details:",
        err,
      );

      setPatientDetailsError(
        err instanceof Error
          ? err.message
          : "Failed to load patient details.",
      );
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  // ============================================================
  // Close Patient Details
  // ============================================================

  const closePatientDetails = () => {
    setSelectedPatient(null);
    setPatientDetailsError(null);
  };

  // ============================================================
  // Add Patient Form
  // ============================================================

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      gender: "Male",
      phone: "",
      email: "",
      bloodGroup: "",
      conditions: "",
      allergies: "",
    });

    setAddPatientError(null);
  };

  const closeAddPatientModal = () => {
    if (addingPatient) {
      return;
    }

    setShowAddPatient(false);
    resetForm();
  };

  const handleFormChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (addPatientError) {
      setAddPatientError(null);
    }
  };

  // ============================================================
  // Add Patient
  // ============================================================

  const handleAddPatient = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setAddPatientError(null);

    const name =
      formData.name.trim();

    const age =
      Number(formData.age);

    if (!name) {
      setAddPatientError(
        "Patient name is required.",
      );
      return;
    }

    if (!formData.age.trim()) {
      setAddPatientError(
        "Patient age is required.",
      );
      return;
    }

    if (
      !Number.isInteger(age) ||
      age <= 0 ||
      age > 150
    ) {
      setAddPatientError(
        "Please enter a valid age between 1 and 150.",
      );
      return;
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim(),
      )
    ) {
      setAddPatientError(
        "Please enter a valid email address.",
      );
      return;
    }

    const conditions =
      formData.conditions
        .split(",")
        .map((condition) =>
          condition.trim(),
        )
        .filter(Boolean);

    const allergies =
      formData.allergies
        .split(",")
        .map((allergy) =>
          allergy.trim(),
        )
        .filter(Boolean);

    try {
      setAddingPatient(true);

      const newPatient =
        await createPatient({
          name,
          age,
          gender: formData.gender,
          phone:
            formData.phone.trim() ||
            null,
          email:
            formData.email.trim() ||
            null,
          bloodGroup:
            formData.bloodGroup.trim() ||
            null,
          conditions,
          allergies,
          medications: [],
        });

      setPatients((previous) => [
        newPatient,
        ...previous,
      ]);

      setShowAddPatient(false);
      resetForm();
    } catch (err) {
      console.error(
        "Failed to create patient:",
        err,
      );

      setAddPatientError(
        err instanceof Error
          ? err.message
          : "Failed to create patient. Please try again.",
      );
    } finally {
      setAddingPatient(false);
    }
  };

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>
            Loading patients...
          </span>
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

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Patients
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage and view patient records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setAddPatientError(null);
              setShowAddPatient(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Add Patient
          </button>
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
                setSearchTerm(
                  event.target.value,
                )
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

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {searchTerm.trim()
                ? `${filteredPatients.length} patient${
                    filteredPatients.length ===
                    1
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
        {/* No Patients */}
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

            <button
              type="button"
              onClick={() => {
                setAddPatientError(null);
                setShowAddPatient(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Patient
            </button>
          </div>
        )}

        {/* ================================================== */}
        {/* No Search Results */}
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
        {/* Patient Table */}
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
                  {filteredPatients.map(
                    (patient) => (
                      <tr
                        key={patient.id}
                        onClick={() =>
                          handlePatientClick(
                            patient.id,
                          )
                        }
                        className="cursor-pointer transition hover:bg-blue-50"
                      >
                        {/* Patient */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                              <UserRound className="h-5 w-5 text-blue-600" />
                            </div>

                            <div>
                              <p className="font-medium text-slate-900">
                                {patient.name ||
                                  "Unknown"}
                              </p>

                              <p className="text-xs text-slate-400">
                                Click to view details
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
                          {patient.age ??
                            "—"}
                        </td>

                        {/* Gender */}

                        <td className="px-6 py-4 text-sm capitalize text-slate-600">
                          {patient.gender ||
                            "—"}
                        </td>

                        {/* Phone */}

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {patient.phone ||
                            "—"}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* Add Patient Modal */}
      {/* ====================================================== */}

      {showAddPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAddPatientModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Header */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Add Patient
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new patient record.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeAddPatientModal
                }
                disabled={addingPatient}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                handleAddPatient
              }
            >
              <div className="space-y-6 p-6">

                {/* Error */}

                {addPatientError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-medium text-red-700">
                      {addPatientError}
                    </p>
                  </div>
                )}

                {/* Basic Information */}

                <div>
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    {/* Name */}

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="patient-name"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Full Name
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        id="patient-name"
                        name="name"
                        type="text"
                        value={
                          formData.name
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="Enter patient name"
                        disabled={
                          addingPatient
                        }
                        autoFocus
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    {/* Age */}

                    <div>
                      <label
                        htmlFor="patient-age"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Age
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        id="patient-age"
                        name="age"
                        type="number"
                        min="1"
                        max="150"
                        value={
                          formData.age
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="Enter age"
                        disabled={
                          addingPatient
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    {/* Gender */}

                    <div>
                      <label
                        htmlFor="patient-gender"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Gender
                      </label>

                      <select
                        id="patient-gender"
                        name="gender"
                        value={
                          formData.gender
                        }
                        onChange={
                          handleFormChange
                        }
                        disabled={
                          addingPatient
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      >
                        <option value="Male">
                          Male
                        </option>

                        <option value="Female">
                          Female
                        </option>

                        <option value="Other">
                          Other
                        </option>
                      </select>
                    </div>

                    {/* Phone */}

                    <div>
                      <label
                        htmlFor="patient-phone"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Phone
                      </label>

                      <input
                        id="patient-phone"
                        name="phone"
                        type="tel"
                        value={
                          formData.phone
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="Enter phone number"
                        disabled={
                          addingPatient
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    {/* Email */}

                    <div>
                      <label
                        htmlFor="patient-email"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Email
                      </label>

                      <input
                        id="patient-email"
                        name="email"
                        type="email"
                        value={
                          formData.email
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="Enter email address"
                        disabled={
                          addingPatient
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    {/* Blood Group */}

                    <div>
                      <label
                        htmlFor="patient-blood-group"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Blood Group
                      </label>

                      <select
                        id="patient-blood-group"
                        name="bloodGroup"
                        value={
                          formData.bloodGroup
                        }
                        onChange={
                          handleFormChange
                        }
                        disabled={
                          addingPatient
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      >
                        <option value="">
                          Select blood group
                        </option>
                        <option value="A+">
                          A+
                        </option>
                        <option value="A-">
                          A-
                        </option>
                        <option value="B+">
                          B+
                        </option>
                        <option value="B-">
                          B-
                        </option>
                        <option value="AB+">
                          AB+
                        </option>
                        <option value="AB-">
                          AB-
                        </option>
                        <option value="O+">
                          O+
                        </option>
                        <option value="O-">
                          O-
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}

                <div>
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">
                    Medical Information
                  </h3>

                  <div className="space-y-4">

                    {/* Conditions */}

                    <div>
                      <label
                        htmlFor="patient-conditions"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Medical Conditions
                      </label>

                      <input
                        id="patient-conditions"
                        name="conditions"
                        type="text"
                        value={
                          formData.conditions
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="e.g. Diabetes, Hypertension"
                        disabled={
                          addingPatient
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />

                      <p className="mt-1.5 text-xs text-slate-400">
                        Separate multiple conditions with commas.
                      </p>
                    </div>

                    {/* Allergies */}

                    <div>
                      <label
                        htmlFor="patient-allergies"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Allergies
                      </label>

                      <input
                        id="patient-allergies"
                        name="allergies"
                        type="text"
                        value={
                          formData.allergies
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="e.g. Penicillin, Aspirin"
                        disabled={
                          addingPatient
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />

                      <p className="mt-1.5 text-xs text-slate-400">
                        Separate multiple allergies with commas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeAddPatientModal
                  }
                  disabled={
                    addingPatient
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    addingPatient
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addingPatient ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding Patient...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Patient
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* Patient Details Modal */}
      {/* ====================================================== */}

      {(selectedPatient ||
        loadingPatientDetails ||
        patientDetailsError) && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePatientDetails();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Details Header */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <UserRound className="h-6 w-6 text-blue-600" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {loadingPatientDetails
                      ? "Patient Details"
                      : selectedPatient?.name ||
                        "Patient Details"}
                  </h2>

                  {selectedPatient && (
                    <p className="mt-1 text-sm text-slate-500">
                      Patient ID: #
                      {
                        selectedPatient.id
                      }
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closePatientDetails
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close patient details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Loading */}

            {loadingPatientDetails && (
              <div className="flex min-h-[350px] items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>
                    Loading patient details...
                  </span>
                </div>
              </div>
            )}

            {/* Error */}

            {!loadingPatientDetails &&
              patientDetailsError && (
                <div className="p-6">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                      <div>
                        <p className="font-medium text-red-700">
                          Failed to load patient
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                          {
                            patientDetailsError
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Patient Details */}

            {!loadingPatientDetails &&
              !patientDetailsError &&
              selectedPatient && (
                <div className="space-y-6 p-6">

                  {/* ================================================== */}
                  {/* Basic Information */}
                  {/* ================================================== */}

                  <section>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Basic Information
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                      {/* Age */}

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Age
                            </p>

                            <p className="mt-0.5 font-medium text-slate-900">
                              {
                                selectedPatient.age
                              }{" "}
                              years
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Gender */}

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                            <UserRound className="h-4 w-4 text-blue-600" />
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Gender
                            </p>

                            <p className="mt-0.5 font-medium text-slate-900">
                              {
                                selectedPatient.gender
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Phone */}

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                            <Phone className="h-4 w-4 text-blue-600" />
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Phone
                            </p>

                            <p className="mt-0.5 font-medium text-slate-900">
                              {
                                selectedPatient.phone ||
                                "Not provided"
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Email */}

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                            <Mail className="h-4 w-4 text-blue-600" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs text-slate-500">
                              Email
                            </p>

                            <p className="mt-0.5 truncate font-medium text-slate-900">
                              {
                                selectedPatient.email ||
                                "Not provided"
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Blood Group */}

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                            <Droplets className="h-4 w-4 text-red-500" />
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Blood Group
                            </p>

                            <p className="mt-0.5 font-medium text-slate-900">
                              {
                                selectedPatient.bloodGroup ||
                                "Not provided"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ================================================== */}
                  {/* Medical Conditions */}
                  {/* ================================================== */}

                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <HeartPulse className="h-5 w-5 text-blue-600" />

                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Medical Conditions
                      </h3>
                    </div>

                    {selectedPatient.conditions
                      ?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.conditions.map(
                          (
                            condition,
                          ) => (
                            <span
                              key={
                                condition
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                            >
                              {
                                condition
                              }
                            </span>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                        <p className="text-sm text-slate-500">
                          No medical conditions recorded.
                        </p>
                      </div>
                    )}
                  </section>

                  {/* ================================================== */}
                  {/* Allergies */}
                  {/* ================================================== */}

                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />

                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Allergies
                      </h3>
                    </div>

                    {selectedPatient.allergies
                      ?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.allergies.map(
                          (
                            allergy,
                          ) => (
                            <span
                              key={
                                allergy
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                            >
                              {
                                allergy
                              }
                            </span>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                        <p className="text-sm text-slate-500">
                          No allergies recorded.
                        </p>
                      </div>
                    )}
                  </section>

                  {/* ================================================== */}
                  {/* Current Medications */}
                  {/* ================================================== */}

                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <Pill className="h-5 w-5 text-emerald-600" />

                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Current Medications
                      </h3>
                    </div>

                    {selectedPatient.medications
                      ?.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px]">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Medicine
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Dosage
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Frequency
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Start Date
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  End Date
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                              {selectedPatient.medications.map(
                                (
                                  medication,
                                ) => (
                                  <tr
                                    key={
                                      medication.id
                                    }
                                    className="hover:bg-slate-50"
                                  >
                                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                      {
                                        medication.medicineName
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-600">
                                      {
                                        medication.dosage ||
                                        "—"
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-600">
                                      {
                                        medication.frequency ||
                                        "—"
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-600">
                                      {
                                        medication.startDate ||
                                        "—"
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-600">
                                      {
                                        medication.endDate ||
                                        "—"
                                      }
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                        <Pill className="mx-auto h-6 w-6 text-slate-400" />

                        <p className="mt-2 text-sm text-slate-500">
                          No current medications recorded.
                        </p>
                      </div>
                    )}
                  </section>

                  {/* ================================================== */}
                  {/* Record Information */}
                  {/* ================================================== */}

                  <section className="border-t border-slate-200 pt-5">
                    <p className="text-xs text-slate-400">
                      Patient record created on{" "}
                      {selectedPatient.createdAt
                        ? new Date(
                            selectedPatient.createdAt,
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )
                        : "—"}
                    </p>
                  </section>
                </div>
              )}
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* Loading Patient Details Overlay */}
      {/* ====================================================== */}

      {loadingPatientDetails &&
        !selectedPatient &&
        !patientDetailsError && (
          <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/20">
            <div className="rounded-xl bg-white px-5 py-4 shadow-xl">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                Loading patient...
              </div>
            </div>
          </div>
        )}
    </div>
  );
}