import {
  AlertCircle,
  CheckCircle2,
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
            Documented Side Effects
          </h2>

          <p className="mt-0.5 text-sm text-slate-500">
            Side effects associated with the selected medicine
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
        <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <CheckCircle2
            size={19}
            className="shrink-0 text-emerald-600"
          />

          <p className="text-sm text-emerald-700">
            No documented side effects are available
            for this medicine in the database.
          </p>
        </div>
      )}
    </section>
  );
};

export default SideEffects;