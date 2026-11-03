import { useEffect, useMemo, useState, type FormEvent } from "react";
import { searchMedicines } from "../../services/medicineService";
import {
  addPatientAdverseReaction,
  addPatientAllergy,
  addPatientClinicalNote,
  addPatientCondition,
  addPatientMeasurement,
  addPatientMedication,
} from "../../services/patientService";
import type { Medicine } from "../../types/medicine";
import type {
  HistorySeverity,
  Patient,
  VerificationStatus,
} from "../../types/patient";

export type PatientRecordKind =
  | "condition"
  | "allergy"
  | "medication"
  | "reaction"
  | "measurement"
  | "note";

interface PatientRecordEditorProps {
  patientId: number;
  kind: PatientRecordKind;
  onClose: () => void;
  onSaved: (patient: Patient) => void;
}

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function PatientRecordEditor({
  patientId,
  kind,
  onClose,
  onSaved,
}: PatientRecordEditorProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [medicineSearch, setMedicineSearch] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = medicineSearch.trim();
    if (query.length < 2) {
      setMedicines([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      searchMedicines(query)
        .then((items) => {
          if (active) setMedicines(items);
        })
        .catch((searchError: unknown) => {
          console.error("Medicine search failed:", searchError);
          if (active) setError("Medicine search is unavailable. Try again.");
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [medicineSearch]);

  const title = useMemo(
    () => ({
      condition: "Add medical condition",
      allergy: "Record allergy",
      medication: "Add medication history",
      reaction: "Record adverse reaction",
      measurement: "Add vital or laboratory result",
      note: "Add clinical note",
    })[kind],
    [kind],
  );
  const set = (key: string, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      let updated: Patient;
      if (kind === "condition") {
        updated = await addPatientCondition(patientId, {
          conditionName: values.conditionName ?? "",
          diagnosisDate: values.diagnosisDate || null,
          status: (values.status as "current" | "resolved" | "unknown") || "current",
          clinicalNotes: values.clinicalNotes || null,
        });
      } else if (kind === "allergy") {
        updated = await addPatientAllergy(patientId, {
          allergyName: values.allergyName ?? "",
          reaction: values.reaction || null,
          severity: (values.severity as HistorySeverity) || "unknown",
          verificationStatus: (values.verificationStatus as VerificationStatus) || "patient_reported",
        });
      } else if (kind === "medication") {
        if (!selectedMedicine) throw new Error("Choose a medicine from the search results.");
        const status = (values.treatmentStatus || "current") as "current" | "completed" | "discontinued" | "unknown";
        updated = await addPatientMedication(patientId, {
          medicineId: selectedMedicine.id,
          dosage: values.dosage || null,
          frequency: values.frequency || null,
          startDate: values.startDate || null,
          endDate: values.endDate || null,
          treatmentStatus: status,
          treatmentDuration: values.treatmentDuration || null,
          discontinuationDate: values.discontinuationDate || null,
          discontinuationReason: values.discontinuationReason || null,
          adverseReaction: values.adverseReaction === "" ? null : values.adverseReaction === "yes",
        });
      } else if (kind === "reaction") {
        updated = await addPatientAdverseReaction(patientId, {
          medicineId: selectedMedicine?.id ?? null,
          suspectedMedicine: values.suspectedMedicine || selectedMedicine?.name || "",
          reaction: values.reaction ?? "",
          severity: (values.severity as "mild" | "moderate" | "severe" | "unknown") || "unknown",
          startedAt: values.startedAt || null,
          duration: values.duration || null,
          medicationStopped: values.medicationStopped === "" ? null : values.medicationStopped === "yes",
          symptomsResolvedAfterStopping: values.symptomsResolvedAfterStopping === "" ? null : values.symptomsResolvedAfterStopping === "yes",
          symptomsReturnedAfterRestarting: values.symptomsReturnedAfterRestarting === "" ? null : values.symptomsReturnedAfterRestarting === "yes",
          treatmentReceived: values.treatmentReceived || null,
          outcome: values.outcome || null,
          clinicalNotes: values.clinicalNotes || null,
          reporterType: (values.reporterType as "patient_reported" | "caregiver_reported" | "clinician_reported") || "patient_reported",
          verificationStatus: (values.verificationStatus as "unverified" | "patient_reported" | "clinician_verified") || "unverified",
        });
      } else if (kind === "measurement") {
        updated = await addPatientMeasurement(patientId, {
          measurementName: values.measurementName ?? "",
          value: values.value === "" ? null : Number(values.value),
          valueText: values.valueText || null,
          unit: values.unit || null,
          systolicValue: values.systolicValue === "" ? null : Number(values.systolicValue),
          diastolicValue: values.diastolicValue === "" ? null : Number(values.diastolicValue),
          measuredAt: values.measuredAt || new Date().toISOString(),
          clinicalNotes: values.clinicalNotes || null,
        });
      } else {
        updated = await addPatientClinicalNote(patientId, values.note ?? "");
      }
      onSaved(updated);
      onClose();
    } catch (saveError) {
      console.error("Failed to save patient record:", saveError);
      setError(saveError instanceof Error ? saveError.message : "Could not save this record.");
    } finally {
      setSaving(false);
    }
  };

  const textField = (label: string, key: string, required = false, type = "text") => (
    <label className="block text-sm font-medium text-slate-700">
      {label}{required ? " *" : ""}
      <input required={required} type={type} value={values[key] ?? ""} onChange={(event) => set(key, event.target.value)} className={`${fieldClass} mt-1.5`} />
    </label>
  );
  const selectField = (label: string, key: string, options: string[]) => (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select value={values[key] ?? options[0]} onChange={(event) => set(key, event.target.value)} className={`${fieldClass} mt-1.5`}>
        {options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
  const textArea = (label: string, key: string, required = false) => (
    <label className="block text-sm font-medium text-slate-700">
      {label}{required ? " *" : ""}
      <textarea required={required} rows={3} value={values[key] ?? ""} onChange={(event) => set(key, event.target.value)} className={`${fieldClass} mt-1.5`} />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div><h2 className="text-xl font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">History entries are retained so the patient record remains auditable.</p></div>
          <button type="button" onClick={onClose} disabled={saving} className="text-sm font-medium text-slate-500">Cancel</button>
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {kind === "condition" && <div className="grid gap-4 sm:grid-cols-2">{textField("Condition", "conditionName", true)}{textField("Diagnosis date", "diagnosisDate", false, "date")}{selectField("Status", "status", ["current", "resolved", "unknown"])}<div className="sm:col-span-2">{textArea("Clinical notes", "clinicalNotes")}</div></div>}
        {kind === "allergy" && <div className="grid gap-4 sm:grid-cols-2">{textField("Substance or medicine", "allergyName", true)}{textField("Reaction", "reaction")}{selectField("Severity", "severity", ["unknown", "mild", "moderate", "severe"])}{selectField("Verification", "verificationStatus", ["patient_reported", "unverified", "clinician_verified"])}</div>}
        {kind === "medication" && <div className="space-y-4">
          <MedicinePicker search={medicineSearch} results={medicines} selected={selectedMedicine} onSearch={(value) => { setMedicineSearch(value); setSelectedMedicine(null); }} onSelect={(medicine) => { setSelectedMedicine(medicine); setMedicineSearch(medicine.name); }} />
          <div className="grid gap-4 sm:grid-cols-2">{textField("Dosage", "dosage")}{textField("Frequency", "frequency", true)}{textField("Start date", "startDate", false, "date")}{textField("End date", "endDate", true, "date")}{selectField("Treatment status", "treatmentStatus", ["current", "completed", "discontinued", "unknown"])}{textField("Treatment duration", "treatmentDuration")}{textField("Discontinuation date", "discontinuationDate", false, "date")}{textField("Reason for discontinuation", "discontinuationReason")}{selectField("Adverse reaction occurred?", "adverseReaction", ["", "yes", "no"])}</div>
        </div>}
        {kind === "reaction" && <div className="space-y-4">
          <MedicinePicker search={medicineSearch} results={medicines} selected={selectedMedicine} onSearch={(value) => { setMedicineSearch(value); setSelectedMedicine(null); set("suspectedMedicine", value); }} onSelect={(medicine) => { setSelectedMedicine(medicine); setMedicineSearch(medicine.name); set("suspectedMedicine", medicine.name); }} />
          {textField("Suspected medicine (if not in library)", "suspectedMedicine", !selectedMedicine)}
          {textArea("Experienced reaction / side effect", "reaction", true)}
          <div className="grid gap-4 sm:grid-cols-2">{selectField("Severity", "severity", ["unknown", "mild", "moderate", "severe"])}{textField("When it started", "startedAt", false, "date")}{textField("Duration", "duration")}{selectField("Medication stopped?", "medicationStopped", ["", "yes", "no"])}{selectField("Symptoms resolved after stopping?", "symptomsResolvedAfterStopping", ["", "yes", "no"])}{selectField("Symptoms returned after restarting?", "symptomsReturnedAfterRestarting", ["", "yes", "no"])}{textField("Treatment received", "treatmentReceived")}{textField("Outcome", "outcome")}{selectField("Reported by", "reporterType", ["patient_reported", "caregiver_reported", "clinician_reported"])}{selectField("Clinician verification", "verificationStatus", ["unverified", "patient_reported", "clinician_verified"])}</div>
          {textArea("Clinical notes", "clinicalNotes")}
        </div>}
        {kind === "measurement" && <div className="grid gap-4 sm:grid-cols-2">
          {selectField("Measurement", "measurementName", ["height", "weight", "blood_pressure", "blood_glucose", "kidney_function", "liver_function", "other"])}
          {textField("Value", "value", false, "number")}{textField("Unit", "unit")}{textField("Text result", "valueText")}{textField("Systolic (blood pressure)", "systolicValue", false, "number")}{textField("Diastolic (blood pressure)", "diastolicValue", false, "number")}{textField("Measured at", "measuredAt", false, "datetime-local")}
          <div className="sm:col-span-2">{textArea("Clinical notes", "clinicalNotes")}</div>
        </div>}
        {kind === "note" && textArea("Clinical note", "note", true)}
        <div className="flex justify-end border-t border-slate-100 pt-4"><button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Save record"}</button></div>
      </form>
    </div>
  );
}

function MedicinePicker({
  search,
  results,
  selected,
  onSearch,
  onSelect,
}: {
  search: string;
  results: Medicine[];
  selected: Medicine | null;
  onSearch: (value: string) => void;
  onSelect: (medicine: Medicine) => void;
}) {
  return (
    <label className="relative block text-sm font-medium text-slate-700">
      Medicine search {selected && <span className="font-normal text-emerald-700">· {selected.name} selected</span>}
      <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search medicine library" className={`${fieldClass} mt-1.5`} />
      {results.length > 0 && !selected && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((medicine) => <button type="button" key={medicine.id} onClick={() => onSelect(medicine)} className="block w-full px-3 py-2 text-left hover:bg-blue-50"><span className="block text-sm font-medium">{medicine.name}</span>{medicine.genericName && <span className="text-xs text-slate-500">{medicine.genericName}</span>}</button>)}
        </div>
      )}
    </label>
  );
}

export default PatientRecordEditor;
