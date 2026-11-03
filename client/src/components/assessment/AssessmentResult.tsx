import { ShieldCheck } from "lucide-react";

import type {
  ReactElement,
} from "react";

import type {
  AssessmentResponse,
} from "../../services/assessmentService";


interface AssessmentResultCardProps {

  result:
    AssessmentResponse;
}


const AssessmentResultCard = ({
  result,
}: AssessmentResultCardProps): ReactElement => {

  const predictedADRs =
    result.prediction.predictedADRs;


  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">

      <div className="flex items-start gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">

          <ShieldCheck
            size={23}
          />

        </div>


        <div className="min-w-0 flex-1">

          <p className="text-sm font-medium text-blue-700">
            Assessment Completed
          </p>


          <h3 className="mt-1 text-xl font-bold text-slate-900">
            {result.medicine.name}
          </h3>


          <p className="mt-2 text-sm leading-6 text-slate-600">
            {result.disclaimer}
          </p>


          <div className="mt-4 flex flex-wrap gap-3">

            {/* PATIENT */}

            <div className="rounded-lg bg-white px-4 py-2">

              <p className="text-xs text-slate-400">
                Patient
              </p>

              <p className="text-sm font-semibold text-slate-800">
                {result.patient.name}
              </p>

            </div>


            {/* ADR COUNT */}

            <div className="rounded-lg bg-white px-4 py-2">

              <p className="text-xs text-slate-400">
                Predicted ADRs
              </p>

              <p className="text-sm font-semibold text-slate-800">
                {result.prediction.available ? predictedADRs.length : "Unavailable"}
              </p>

            </div>


            {/* SAFETY */}

            <div className="rounded-lg bg-white px-4 py-2">

              <p className="text-xs text-slate-400">
                Safety alerts
              </p>

              <p className="text-sm font-semibold text-slate-800">
                {result.patientSafety.alertCount}
              </p>

            </div>

          </div>

          {(result.patientSafety.alerts.length > 0 ||
            (result.patientSafety.missingInformation?.length ?? 0) > 0) && (
            <div className="mt-5 space-y-3 border-t border-blue-200 pt-4">
              {result.patientSafety.alerts.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Patient-specific findings
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {result.patientSafety.alerts.map((alert, index) => (
                      <li
                        key={`${alert.type}-${index}`}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <p className="text-sm font-semibold text-slate-800">
                          {alert.title}
                          <span className="ml-2 text-xs font-medium uppercase text-slate-500">
                            {alert.severity}
                          </span>
                        </p>
                        <p className="mt-1 text-sm leading-5 text-slate-600">
                          {alert.message}
                        </p>
                        {alert.evidence && (
                          <p className="mt-1 text-xs text-slate-500">
                            Evidence: {alert.evidence}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.patientSafety.missingInformation?.length ? (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Information not recorded
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {result.patientSafety.missingInformation.join(" ")}
                  </p>
                </div>
              ) : null}
              {Object.entries(result.patientSafety.checkAvailability ?? {})
                .filter(([, state]) => state === "unavailable").length > 0 && (
                <p className="text-xs leading-5 text-amber-800">
                  Some safety checks could not be completed because validated
                  reference data is unavailable for this check.
                </p>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};


export default AssessmentResultCard;