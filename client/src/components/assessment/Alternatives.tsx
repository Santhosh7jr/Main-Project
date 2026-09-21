import {
  ArrowRight,
  Pill,
  Sparkles,
} from "lucide-react";

import type { AlternativeResult } from "../../services/alternativeService";

interface AlternativesProps {
  alternatives: AlternativeResult[];
  onSelectAlternative: (medicineId: number) => void;
}

function Alternatives({
  alternatives,
  onSelectAlternative,
}: AlternativesProps) {
  return (
    <section>
      {/* Header */}
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
          <Sparkles size={20} />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Potential Alternatives
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Similar medicines identified for clinician
            review.
          </p>
        </div>
      </div>

      {/* No alternatives */}
      {alternatives.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <Pill
              size={19}
              className="text-slate-400"
            />

            <div>
              <p className="text-sm font-medium text-slate-700">
                No potential alternatives identified
              </p>

              <p className="mt-1 text-xs text-slate-500">
                No sufficiently similar medicines were
                found for this assessment.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {alternatives.map((alternative) => {
            const similarity = Math.round(
              alternative.similarity * 100
            );

            return (
              <div
                key={alternative.medicine.id}
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
              >
                {/* Medicine header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Pill size={18} />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {alternative.medicine.name}
                      </h4>

                      {alternative.medicine
                        .genericName && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {
                            alternative.medicine
                              .genericName
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Similarity */}
                  <div className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {similarity}% similar
                  </div>
                </div>

                {/* Similarity bar */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">
                      Similarity
                    </span>

                    <span className="text-[11px] font-semibold text-slate-500">
                      {similarity}%
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${Math.min(
                          similarity,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Reason */}
                {alternative.reason && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Why it was suggested
                    </p>

                    <p className="mt-1.5 text-sm leading-5 text-slate-600">
                      {alternative.reason}
                    </p>
                  </div>
                )}

                {/* Therapeutic class */}
                {alternative.medicine
                  .therapeuticClass && (
                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Therapeutic Class
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {
                        alternative.medicine
                          .therapeuticClass
                      }
                    </p>
                  </div>
                )}

                {/* Uses */}
                {alternative.medicine.uses.length >
                  0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Common Uses
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {alternative.medicine.uses
                        .slice(0, 5)
                        .map((use, index) => (
                          <span
                            key={`${alternative.medicine.id}-${index}`}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          >
                            {use}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Select alternative */}
                <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <ArrowRight size={13} />
                    Review this medicine before selecting it
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onSelectAlternative(
                        alternative.medicine.id
                      )
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    Assess & Select
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