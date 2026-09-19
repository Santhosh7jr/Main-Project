import {
  Activity,
  ShieldCheck,
} from "lucide-react";

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

            The medicine-level ML model identified potential
            adverse drug reactions. A separate patient-safety
            layer analyzed the selected patient's recorded
            information.

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
                {predictedADRs.length}
              </p>

            </div>


            {/* MODEL OUTPUT */}

            <div className="rounded-lg bg-white px-4 py-2">

              <p className="text-xs text-slate-400">
                Model output
              </p>

              <p className="text-sm font-semibold text-slate-800">
                {result.riskLevel}
              </p>

            </div>


            {/* SCORE */}

            <div className="rounded-lg bg-white px-4 py-2">

              <p className="text-xs text-slate-400">
                Model score
              </p>

              <p className="text-sm font-semibold text-slate-800">
                {result.confidence.toFixed(3)}
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


          {/* MODEL SCORE EXPLANATION */}

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3">

            <Activity
              size={18}
              className="mt-0.5 shrink-0 text-blue-600"
            />


            <p className="text-xs leading-5 text-slate-600">

              <span className="font-semibold text-slate-800">
                Model score:
              </span>{" "}

              This is the strongest decision score returned
              by the Linear SVM. It is not a calibrated
              probability and should not be interpreted as
              a percentage chance of an adverse reaction.

            </p>

          </div>

        </div>

      </div>

    </div>
  );
};


export default AssessmentResultCard;