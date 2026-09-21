import { ArrowRight, ExternalLink, Pill, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AlternativeResult } from "../../services/alternativeService";

interface AlternativesProps {
  alternatives: AlternativeResult[];
  onSelectAlternative: (medicineId: number) => void;
  selectedMedicineId?: number | null;
}

function getMatchStyle(level: string | undefined) {
  switch (level) {
    case "Strong match":
      return "bg-green-50 text-green-700";
    case "Good match":
      return "bg-blue-50 text-blue-700";
    case "Moderate match":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function Alternatives({
  alternatives,
  onSelectAlternative,
  selectedMedicineId,
}: AlternativesProps) {
  const navigate = useNavigate();

  return (
    <section>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Potential Alternatives</h3>
          <p className="mt-1 text-sm text-slate-500">
            Medicines with similar database characteristics and uses. These are suggestions for clinician review, not automatic substitutions.
          </p>
        </div>
      </div>

      {alternatives.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <Pill size={19} className="text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-700">No potential alternatives identified</p>
              <p className="mt-1 text-xs text-slate-500">No sufficiently similar medicines were found for this assessment.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {alternatives.map((alternative) => {
            const similarity = Math.round(alternative.similarity * 100);
            const level = alternative.matchLevel ?? (
              similarity >= 75 ? "Strong match" : similarity >= 50 ? "Good match" : similarity >= 30 ? "Moderate match" : "Possible match"
            );

            return (
              <div key={alternative.medicine.id} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Pill size={18} /></div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900">{alternative.medicine.name}</h4>
                      {alternative.medicine.genericName && <p className="mt-0.5 text-xs text-slate-500">{alternative.medicine.genericName}</p>}
                    </div>
                  </div>
                  <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getMatchStyle(level)}`}>
                    {level}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">Metadata match</span>
                    <span className="text-[11px] font-semibold text-slate-500">{similarity}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(similarity, 99)}%` }} />
                  </div>
                </div>

                {alternative.reason && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Why it was suggested</p>
                    <p className="mt-1.5 text-sm leading-5 text-slate-600">{alternative.reason}</p>
                  </div>
                )}

                {alternative.medicine.therapeuticClass && (
                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Therapeutic Class</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{alternative.medicine.therapeuticClass}</p>
                  </div>
                )}

                {alternative.medicine.uses.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Common Uses</p>
                    <div className="flex flex-wrap gap-2">
                      {alternative.medicine.uses.slice(0, 5).map((use, index) => (
                        <span key={`${alternative.medicine.id}-${index}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{use}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap">
                  <button type="button" onClick={() => navigate(`/medicines/${alternative.medicine.id}`)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <ExternalLink size={14} /> Review medicine
                  </button>
                  <button type="button" onClick={() => navigate(`/medicine-compare?medicine1=${selectedMedicineId ?? ""}&medicine2=${alternative.medicine.id}`)} disabled={!selectedMedicineId} className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-200 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50">
                    Compare
                  </button>
                  <button type="button" onClick={() => onSelectAlternative(alternative.medicine.id)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 sm:ml-auto">
                    Assess & Select <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Alternatives;
