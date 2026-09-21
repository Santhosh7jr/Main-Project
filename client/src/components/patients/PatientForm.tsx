import { useState } from "react";
import { X } from "lucide-react";

import type { Patient } from "../../types/patient";

interface PatientFormProps {
  onClose: () => void;

  onSubmit: (
    patient: Omit<
      Patient,
      "id" | "createdAt" | "assessmentHistory"
    >
  ) => Promise<void>;
}

const PatientForm = ({
  onClose,
  onSubmit,
}: PatientFormProps) => {

  const [name, setName] =
    useState("");

  const [age, setAge] =
    useState("");

  const [gender, setGender] =
    useState<
      "Male" | "Female" | "Other"
    >("Male");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [bloodGroup, setBloodGroup] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setError("");


    if (!name.trim()) {
      setError(
        "Patient name is required."
      );

      return;
    }


    if (!age || Number(age) <= 0) {
      setError(
        "Please enter a valid age."
      );

      return;
    }


    try {

      setSaving(true);

      await onSubmit({
        name: name.trim(),

        age: Number(age),

        gender,

        phone: phone.trim(),

        email: email.trim(),

        bloodGroup:
          bloodGroup.trim(),

        conditions: [],

        allergies: [],

        medications: [],
      });

    } catch (err) {

      console.error(err);

      setError(
        "Failed to save patient."
      );

    } finally {

      setSaving(false);

    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 p-5">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Add Patient
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Create a new patient record
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>

        </div>


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5"
        >

          {/* NAME */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Enter patient name"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>


          {/* AGE + GENDER */}

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Age
              </label>

              <input
                type="number"
                min="0"
                max="150"
                value={age}
                onChange={(e) =>
                  setAge(e.target.value)
                }
                placeholder="Age"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>


            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Gender
              </label>

              <select
                value={gender}
                onChange={(e) =>
                  setGender(
                    e.target.value as
                      | "Male"
                      | "Female"
                      | "Other"
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

          </div>


          {/* PHONE */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Phone
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder="+91 XXXXX XXXXX"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>


          {/* EMAIL */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="patient@example.com"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>


          {/* BLOOD GROUP */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Blood Group
            </label>

            <select
              value={bloodGroup}
              onChange={(e) =>
                setBloodGroup(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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


          {/* ERROR */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}


          {/* ACTIONS */}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving
                ? "Saving..."
                : "Add Patient"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default PatientForm;