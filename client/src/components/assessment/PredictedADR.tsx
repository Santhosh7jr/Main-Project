import { AlertTriangle, BrainCircuit } from "lucide-react";
import type { ReactElement } from "react";

import type { AssessmentResponse } from "../../services/assessmentService";

interface PredictedADRListProps {
  prediction: AssessmentResponse["prediction"];
}

const PredictedADRList = ({ prediction }: PredictedADRListProps): ReactElement => {
  const { available, predictedADRs, threshold } = prediction;

  return (
    <section className="rounded-xl border border-purple-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
          <BrainCircuit size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Model-predicted ADRs</h3>
          <p className="text-sm text-slate-500">
            Estimates generated from medicine features and historical dataset patterns; these are not confirmed effects for this patient.
          </p>
          {available && prediction.modelType && (
            <p className="mt-1 text-xs text-slate-400">
              Model: {prediction.modelType}
            </p>
          )}
        </div>
      </div>

      {!available ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            Model predictions are unavailable
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {prediction.error ?? "The model service could not return a prediction. Review the known side effects separately."}
          </p>
        </div>
      ) : predictedADRs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
          <AlertTriangle size={24} className="mx-auto mb-2 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">No ADR labels crossed the model threshold.</p>
          <p className="mt-1 text-xs text-slate-500">
            This is not evidence that the medicine has no side effects. Check the documented side-effect section and authoritative references.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictedADRs.map((item, index) => (
            <div key={`${item.adr}-${index}`} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-purple-600">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-800">{item.adr}</span>
                </div>
                <span className="w-fit rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                  Model score: {Number(item.score).toFixed(3)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        <strong>Important interpretation:</strong> This medicine-feature model is not patient-personalized. Linear SVM decision scores are not probabilities, do not measure reaction severity, and are not estimates of individual clinical risk. Labels are estimates, not confirmed or newly discovered effects.
        {available && threshold !== null && <> The selected threshold is {Number(threshold).toFixed(3)} and was chosen using validation data.</>}
      </div>
    </section>
  );
};

export default PredictedADRList;
