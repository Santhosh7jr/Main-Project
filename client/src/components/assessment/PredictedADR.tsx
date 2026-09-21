import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";
import type { ReactElement } from "react";

import type { AssessmentResponse } from "../../services/assessmentService";

interface PredictedADRListProps {
  prediction: AssessmentResponse["prediction"];
}

type Likelihood = "Low" | "Moderate" | "High";

const likelihoodConfig: Record<
  Likelihood,
  {
    label: string;
    description: string;
    badge: string;
    icon: typeof CheckCircle2;
  }
> = {
  Low: {
    label: "Low likelihood",
    description: "Lower model score among the predicted ADRs.",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  Moderate: {
    label: "Moderate likelihood",
    description: "Intermediate model score; clinician review is advised.",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: CircleAlert,
  },
  High: {
    label: "High likelihood",
    description: "Higher model score among the predicted ADRs.",
    badge: "bg-red-50 text-red-700 border-red-200",
    icon: AlertTriangle,
  },
};

const PredictedADRList = ({
  prediction,
}: PredictedADRListProps): ReactElement => {
  const { predictedADRs } = prediction;

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
          <BrainCircuit size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            AI-Predicted ADRs
          </h3>
          <p className="text-sm text-slate-500">
            Potential adverse reactions identified by the ML model.
          </p>
        </div>
      </div>

      {predictedADRs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
          <AlertTriangle size={24} className="mx-auto mb-2 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">
            No ADRs crossed the model threshold.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            This does not mean that the medicine has no possible adverse effects.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictedADRs.map((item, index) => {
            const level: Likelihood =
              item.likelihood === "High" ||
              item.likelihood === "Moderate" ||
              item.likelihood === "Low"
                ? item.likelihood
                : item.score >= 1
                  ? "High"
                  : item.score >= 0.5
                    ? "Moderate"
                    : "Low";

            const config = likelihoodConfig[level];
            const Icon = config.icon;

            return (
              <div
                key={`${item.adr}-${index}`}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-purple-600">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {item.adr}
                    </span>
                  </div>

                  <div
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${config.badge}`}
                  >
                    <Icon size={14} />
                    {config.label}
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {config.description}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        <strong>How to read this:</strong> High, moderate, and low describe the
        model&apos;s relative prediction strength. They are not calibrated medical
        probabilities and do not represent the clinical severity of an adverse
        reaction.
      </div>
    </div>
  );
};

export default PredictedADRList;
