import {
  AlertCircle,
} from "lucide-react";

interface SideEffectsProps {
  sideEffects: string[];
}

const SideEffects = ({
  sideEffects,
}: SideEffectsProps) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
          <AlertCircle size={20} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Known side effects in the dataset
          </h2>

          <p className="mt-0.5 text-sm text-slate-500">
            Retrieved from the medicine dataset. A listed effect is not certain to occur in an individual patient.
          </p>
        </div>
      </div>

      {sideEffects.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {sideEffects.map((effect) => (
            <div
              key={effect}
              className="flex items-center gap-3 rounded-lg border border-orange-100 bg-orange-50/40 p-3"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <AlertCircle size={14} />
              </div>

              <span className="text-sm font-medium text-slate-700">
                {effect}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle
            size={19}
            className="shrink-0 text-amber-600"
          />

          <p className="text-sm text-amber-800">
            No side effects are recorded for this medicine in the dataset.
          </p>
        </div>
      )}
    </section>
  );
};

export default SideEffects;