import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ClipboardList,
  FileText,
  HeartPulse,
  Pencil,
  Pill,
  Plus,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { updatePatient } from "../../services/patientService";
import type { Patient } from "../../types/patient";
import PatientRecordEditor, { type PatientRecordKind } from "./PatientRecordEditor";

interface PatientDetailsProps {
  patient: Patient;
}

const dateLabel = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString() : "Not recorded";

const statusClass: Record<string, string> = {
  clinician_verified: "bg-green-50 text-green-700",
  patient_reported: "bg-blue-50 text-blue-700",
  caregiver_reported: "bg-violet-50 text-violet-700",
  unverified: "bg-amber-50 text-amber-700",
};

function PatientDetails({ patient: initialPatient }: PatientDetailsProps) {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(initialPatient);
  const [recordKind, setRecordKind] = useState<PatientRecordKind | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: patient.name,
    age: String(patient.age),
    gender: patient.gender,
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    bloodGroup: patient.bloodGroup ?? "",
  });

  const currentMedications = (patient.medications ?? []).filter(
    (item) => item.treatmentStatus === "current" ||
      (!item.treatmentStatus && (!item.endDate || item.endDate >= new Date().toISOString().slice(0, 10))),
  );
  const previousMedications = (patient.previousMedications ??
    (patient.medications ?? []).filter((item) => item.treatmentStatus !== "current"));

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const age = Number(profileForm.age);
    if (!profileForm.name.trim() || !Number.isInteger(age) || age < 0 || age > 150) {
      setError("Enter a name and a valid age (0–150).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await updatePatient(patient.id, {
        name: profileForm.name.trim(),
        age,
        gender: profileForm.gender,
        phone: profileForm.phone.trim() || null,
        email: profileForm.email.trim() || null,
        bloodGroup: profileForm.bloodGroup || null,
      });
      setPatient(updated);
      setEditing(false);
    } catch (saveError) {
      console.error("Failed to update patient:", saveError);
      setError("Profile changes could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaved = (updated: Patient) => {
    setPatient(updated);
    setError("");
  };

  const initials = patient.name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <button type="button" onClick={() => navigate("/patients")} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft size={17} /> Patient directory
        </button>
        <button type="button" onClick={() => navigate(`/assessment?patientId=${patient.id}`)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          <ClipboardList size={17} /> Start ADR Assessment
        </button>
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">{initials}</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Patient profile</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{patient.name}</h1>
              <p className="mt-1 text-sm text-slate-500">P-{String(patient.id).padStart(4, "0")} · {patient.age} years · {patient.gender}</p>
            </div>
          </div>
          <button type="button" onClick={() => { setProfileForm({ name: patient.name, age: String(patient.age), gender: patient.gender, phone: patient.phone ?? "", email: patient.email ?? "", bloodGroup: patient.bloodGroup ?? "" }); setEditing(true); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Pencil size={15} /> Edit profile</button>
        </div>
        {editing && (
          <form onSubmit={saveProfile} className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <ProfileField label="Full name"><input required maxLength={150} value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className={inputClass} /></ProfileField>
            <ProfileField label="Age"><input required type="number" min="0" max="150" value={profileForm.age} onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })} className={inputClass} /></ProfileField>
            <ProfileField label="Gender"><select value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value as Patient["gender"] })} className={inputClass}><option>Male</option><option>Female</option><option>Other</option></select></ProfileField>
            <ProfileField label="Phone"><input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputClass} /></ProfileField>
            <ProfileField label="Email"><input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className={inputClass} /></ProfileField>
            <ProfileField label="Blood group"><select value={profileForm.bloodGroup} onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })} className={inputClass}><option value="">Not recorded</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((item) => <option key={item}>{item}</option>)}</select></ProfileField>
            <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Save profile"}</button></div>
          </form>
        )}
        <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4">
          <QuickValue label="Registered" value={dateLabel(patient.createdAt)} />
          <QuickValue label="Current medicines" value={currentMedications.length} />
          <QuickValue label="Conditions" value={patient.conditionRecords?.filter((item) => item.status === "current").length ?? patient.conditions.length} />
          <QuickValue label="Latest assessment" value={dateLabel(patient.latestAssessmentAt ?? patient.assessmentHistory?.[0]?.createdAt)} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ProfileSection title="Overview" subtitle="Personal and contact information" icon={<UserRound size={18} />} action={() => setEditing(true)} actionLabel="Edit">
          <div className="grid gap-4 sm:grid-cols-2"><Info label="Phone" value={patient.phone} /><Info label="Email" value={patient.email} /><Info label="Blood group" value={patient.bloodGroup} /><Info label="Registration date" value={dateLabel(patient.createdAt)} /></div>
        </ProfileSection>

        <ProfileSection title="Medical history" subtitle="Conditions and diagnosis information" icon={<HeartPulse size={18} />} action={() => setRecordKind("condition")}>
          {(patient.conditionRecords?.length ?? 0) > 0 ? <div className="space-y-3">{patient.conditionRecords?.map((condition) => <RecordRow key={condition.id} title={condition.conditionName} subtitle={`${condition.status} · diagnosed ${dateLabel(condition.diagnosisDate)}`} detail={condition.clinicalNotes} />)}</div> : <Empty>No conditions recorded.</Empty>}
        </ProfileSection>

        <ProfileSection title="Current medications" subtitle="Active treatment records" icon={<Pill size={18} />} action={() => setRecordKind("medication")}>
          {currentMedications.length ? <div className="space-y-3">{currentMedications.map((medication) => <RecordRow key={medication.id} title={medication.medicineName} subtitle={[medication.dosage, medication.frequency].filter(Boolean).join(" · ") || "Dose not recorded"} detail={`Started ${dateLabel(medication.startDate)} · Ends ${dateLabel(medication.endDate)} · ${medication.treatmentStatus}`} />)}</div> : <Empty>No current medications recorded.</Empty>}
        </ProfileSection>

        <ProfileSection title="Previous medications" subtitle="Completed or discontinued treatments" icon={<Pill size={18} />} action={() => setRecordKind("medication")}>
          {previousMedications.length ? <div className="space-y-3">{previousMedications.map((medication) => <RecordRow key={medication.id} title={medication.medicineName} subtitle={[medication.dosage, medication.frequency].filter(Boolean).join(" · ") || `${medication.treatmentStatus ?? "previous"} · ${medication.treatmentDuration ?? "duration not recorded"}`} detail={[`Ended ${dateLabel(medication.endDate)}`, medication.discontinuationReason, medication.adverseReaction ? "Adverse reaction reported" : null].filter(Boolean).join(" · ")} />)}</div> : <Empty>No previous medication records.</Empty>}
        </ProfileSection>

        <ProfileSection title="Allergies" subtitle="Recorded substances and verification status" icon={<ShieldAlert size={18} />} action={() => setRecordKind("allergy")}>
          {(patient.allergyDetails?.length ?? 0) ? <div className="space-y-3">{patient.allergyDetails?.map((allergy) => <RecordRow key={allergy.id} title={allergy.allergyName} subtitle={`${allergy.severity} severity · ${allergy.verificationStatus.replaceAll("_", " ")}`} detail={allergy.reaction} badge={allergy.verificationStatus} />)}</div> : <Empty>No allergies recorded.</Empty>}
        </ProfileSection>

        <ProfileSection title="Adverse reactions" subtitle="Reported and verified reactions are distinguished" icon={<Activity size={18} />} action={() => setRecordKind("reaction")}>
          {(patient.adverseReactions?.length ?? 0) ? <div className="space-y-3">{patient.adverseReactions?.map((reaction) => <RecordRow key={reaction.id} title={`${reaction.reaction} · ${reaction.severity}`} subtitle={`${reaction.suspectedMedicine} · ${dateLabel(reaction.startedAt)}`} detail={[reaction.outcome, reaction.treatmentReceived, reaction.clinicalNotes].filter(Boolean).join(" · ")} badge={reaction.verificationStatus} />)}</div> : <Empty>No prior adverse reactions recorded.</Empty>}
        </ProfileSection>

        <ProfileSection title="Vitals and laboratory results" subtitle="Time-stamped measurements" icon={<Activity size={18} />} action={() => setRecordKind("measurement")}>
          {(patient.measurements?.length ?? 0) ? <div className="space-y-3">{patient.measurements?.map((measurement) => <RecordRow key={measurement.id} title={measurement.measurementName.replaceAll("_", " ")} subtitle={measurement.measurementName === "blood_pressure" ? `${measurement.systolicValue ?? "—"}/${measurement.diastolicValue ?? "—"} ${measurement.unit ?? "mmHg"}` : `${measurement.valueText ?? measurement.value ?? "—"} ${measurement.unit ?? ""}`} detail={`${dateLabel(measurement.measuredAt)}${measurement.clinicalNotes ? ` · ${measurement.clinicalNotes}` : ""}`} />)}</div> : <Empty>No measurements recorded.</Empty>}
        </ProfileSection>

        <ProfileSection title="Current complaints" subtitle="Complaints captured in recent assessments" icon={<FileText size={18} />}>
          {(patient.complaints?.length ?? 0) ? <div className="space-y-3">{patient.complaints?.map((complaint) => <RecordRow key={complaint.id} title={complaint.complaint} subtitle={`${complaint.status} · ${dateLabel(complaint.reportedAt)}`} detail={complaint.clinicalNotes} />)}</div> : <Empty>No complaints recorded.</Empty>}
        </ProfileSection>

        <ProfileSection title="Clinical notes" subtitle="Chronological clinician notes" icon={<FileText size={18} />} action={() => setRecordKind("note")}>
          {(patient.clinicalNotes?.length ?? 0) ? <div className="space-y-3">{patient.clinicalNotes?.map((note) => {
            const isMedicineReport =
              note.note.startsWith("AI-generated medicine report:") ||
              note.note.startsWith("AI-generated medicine recommendation report:");
            const noteLines = note.note.split("\n");
            return (
              <RecordRow
                key={note.id}
                title={isMedicineReport ? noteLines[0] : note.note}
                subtitle={dateLabel(note.createdAt)}
                detail={isMedicineReport ? noteLines.slice(1).join("\n") : undefined}
              />
            );
          })}</div> : <Empty>No clinical notes recorded.</Empty>}
        </ProfileSection>

        <ProfileSection title="Assessment history" subtitle="Saved assessments for this patient" icon={<ClipboardList size={18} />}>
          {patient.assessmentHistory.length ? <div className="space-y-3">{patient.assessmentHistory.map((assessment) => <RecordRow key={assessment.id} title={assessment.medicineName} subtitle={`${dateLabel(assessment.createdAt)} · ${assessment.riskLevel} model signal · Decision: ${assessment.doctorDecision?.replace(/_/g, " ") ?? "not recorded"}`} detail={[
            (assessment.predictions ?? []).slice(0, 3).map((item) => item.adr).join(", "),
            assessment.currentComplaints.length ? `Complaints: ${assessment.currentComplaints.join(", ")}` : "",
            assessment.newlyReportedReactions.length ? `Reported reactions: ${assessment.newlyReportedReactions.join(", ")}` : "",
            assessment.actualOutcome ? `Observed outcome: ${assessment.actualOutcome}` : "",
          ].filter(Boolean).join(" · ")} />)}</div> : <Empty>No assessments recorded.</Empty>}
        </ProfileSection>
      </div>

      {recordKind && <PatientRecordEditor patientId={patient.id} kind={recordKind} onClose={() => setRecordKind(null)} onSaved={handleSaved} />}
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm";

function ProfileSection({
  title,
  subtitle,
  icon,
  action,
  actionLabel = "Add record",
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  action?: () => void;
  actionLabel?: string;
  children: ReactNode;
}) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-700">{icon}</div><div><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div></div>{action && <button type="button" onClick={action} aria-label={actionLabel} title={actionLabel} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Plus size={14} /><span className="hidden sm:inline">{actionLabel}</span></button>}</div>
    {children}
  </section>;
}

function RecordRow({ title, subtitle, detail, badge }: { title: string; subtitle?: string; detail?: string | null; badge?: string }) {
  return <div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-semibold capitalize text-slate-800">{title}</p>{badge && <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass[badge] ?? "bg-slate-100 text-slate-600"}`}>{badge.replaceAll("_", " ")}</span>}</div>{subtitle && <p className="mt-1 text-xs capitalize text-slate-500">{subtitle}</p>}{detail && <p className="mt-2 whitespace-pre-line break-words text-xs leading-5 text-slate-600">{detail}</p>}</div>;
}

function Info({ label, value }: { label: string; value: string | null }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value || "Not recorded"}</p></div>;
}

function QuickValue({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value}</p></div>;
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">{children}</p>;
}

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<div className="mt-1.5">{children}</div></label>;
}

export default PatientDetails;
