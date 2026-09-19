import {
  BrainCircuit,
  AlertTriangle,
} from "lucide-react";
import type { ReactElement } from "react";

import type { AssessmentResponse } from "../../services/assessmentService";

interface PredictedADRListProps {
  prediction: AssessmentResponse["prediction"];
}

const PredictedADRList = ({
  prediction,
}: PredictedADRListProps): ReactElement => {
  const { predictedADRs, threshold } = prediction;

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-6 shadow-sm">
      {/* Header */}

      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <BrainCircuit size={20} />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              AI-Predicted ADRs
            </h3>

            <p className="text-sm text-slate-500">
              Potential adverse reactions identified by the ML model
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-purple-50 px-4 py-2 text-right">
          <p className="text-xs text-purple-600">
            Threshold
          </p>

          <p className="text-sm font-bold text-purple-700">
            {threshold.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Predictions */}

      {predictedADRs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
          <AlertTriangle
            size={24}
            className="mx-auto mb-2 text-slate-400"
          />

          <p className="text-sm font-medium text-slate-600">
            No ADRs crossed the model threshold.
          </p>

          <p className="mt-1 text-xs text-slate-400">
            This does not mean that the medicine has no possible
            adverse effects.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictedADRs.map((item, index) => (
            <div
              key={`${item.adr}-${index}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-purple-600">
                  {index + 1}
                </div>

                <span className="text-sm font-medium text-slate-800">
                  {item.adr}
                </span>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-400">
                  Model score
                </p>

                <p className="text-sm font-semibold text-purple-600">
                  {item.score.toFixed(3)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}

      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        <strong>Clinical decision support:</strong>{" "}
        These are model-generated predictions and should be reviewed
        by a qualified clinician alongside patient history and other
        relevant clinical information. They are not a diagnosis or
        prescribing recommendation.
      </div>
    </div>
  );
};

export default PredictedADRList;