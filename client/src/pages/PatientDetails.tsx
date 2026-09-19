import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import PatientDetailsComponent from "../components/patients/PatientDetails";
import { getPatientById } from "../services/patientService";
import type { Patient } from "../types/patient";

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] =
    useState<Patient | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadPatient = async () => {
      if (!id) {
        setError("Invalid patient ID.");
        setLoading(false);
        return;
      }

      const patientId = Number(id);

      if (Number.isNaN(patientId)) {
        setError("Invalid patient ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await getPatientById(patientId);

        setPatient(data);
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load patient information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, [id]);

  /*
   * -----------------------------------------
   * LOADING
   * -----------------------------------------
   */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2
            size={22}
            className="animate-spin"
          />

          <span className="text-sm">
            Loading patient...
          </span>
        </div>
      </div>
    );
  }

  /*
   * -----------------------------------------
   * ERROR / NOT FOUND
   * -----------------------------------------
   */

  if (error || !patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-600">
            !
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Patient Not Found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              "The requested patient could not be found."}
          </p>

          <button
            onClick={() => navigate("/patients")}
            className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <ArrowLeft size={17} />
            Back to Patients
          </button>

        </div>
      </div>
    );
  }

  /*
   * -----------------------------------------
   * PATIENT DETAILS
   * -----------------------------------------
   */

  return (
    <PatientDetailsComponent
      patient={patient}
    />
  );
};

export default PatientDetails;