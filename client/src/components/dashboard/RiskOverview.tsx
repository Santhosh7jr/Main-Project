import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

import type {
  RiskBucket,
} from "../../types/report";

interface RiskOverviewProps {
  distribution: RiskBucket[];
}

function RiskOverview({
  distribution,
}: RiskOverviewProps) {
  const total =
    distribution.reduce(
      (sum, item) =>
        sum + item.count,
      0
    );

  const config = [
    {
      label: "Low Risk",
      key: "Low" as const,
      icon: CheckCircle2,
      background: "bg-green-50",
      color: "text-green-600",
      bar: "bg-green-500",
    },
    {
      label: "Moderate Risk",
      key: "Moderate" as const,
      icon: ShieldAlert,
      background: "bg-yellow-50",
      color: "text-yellow-600",
      bar: "bg-yellow-500",
    },
    {
      label: "High Risk",
      key: "High" as const,
      icon: AlertTriangle,
      background: "bg-red-50",
      color: "text-red-600",
      bar: "bg-red-500",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-lg font-semibold text-slate-900">
          Risk Overview
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Distribution of saved ADR assessments
        </p>

      </div>

      <div className="space-y-6">

        {config.map((item) => {

          const risk =
            distribution.find(
              (entry) =>
                entry.riskLevel ===
                item.key
            );

          const count =
            risk?.count ?? 0;

          const percentage =
            total === 0
              ? 0
              : Math.round(
                  (count / total) * 100
                );

          const Icon = item.icon;

          return (
            <div key={item.key}>

              <div className="mb-2 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.background}`}
                  >
                    <Icon
                      className={`h-5 w-5 ${item.color}`}
                    />
                  </div>

                  <div>

                    <p className="text-sm font-medium text-slate-800">
                      {item.label}
                    </p>

                    <p className="text-xs text-slate-500">
                      {count} assessments
                    </p>

                  </div>

                </div>

                <span className="text-sm font-semibold text-slate-700">
                  {percentage}%
                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                <div
                  className={`h-full rounded-full ${item.bar}`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}

export default RiskOverview;