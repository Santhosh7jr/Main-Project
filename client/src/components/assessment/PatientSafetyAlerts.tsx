import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
} from "lucide-react";

interface PatientSafetyAlert {
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  matchedValue?: string;
  evidence?: string;
}

interface PatientSafetyData {
  alerts: PatientSafetyAlert[];
  criticalCount?: number;
  warningCount?: number;
  infoCount?: number;
}

interface PatientSafetyAlertsProps {
  safety: PatientSafetyData | null | undefined;
}

function PatientSafetyAlerts({
  safety,
}: PatientSafetyAlertsProps) {
  const alerts: PatientSafetyAlert[] = safety?.alerts ?? [];

  const criticalCount = alerts.filter(
    (alert: PatientSafetyAlert) =>
      alert.severity === "critical"
  ).length;

  const warningCount = alerts.filter(
    (alert: PatientSafetyAlert) =>
      alert.severity === "warning"
  ).length;

  const infoCount = alerts.filter(
    (alert: PatientSafetyAlert) =>
      alert.severity === "info"
  ).length;

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={22}
            className="mt-0.5 flex-shrink-0 text-emerald-600"
          />

          <div>
            <h3 className="font-bold text-emerald-900">
              No Patient-Specific Alerts Detected
            </h3>

            <p className="mt-1 text-sm leading-6 text-emerald-800">
              The patient-safety screening did not identify
              any patient-specific alerts from the available
              recorded information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getSeverityStyles = (
    severity: PatientSafetyAlert["severity"]
  ) => {
    switch (severity) {
      case "critical":
        return {
          container: "border-red-200 bg-red-50",
          icon: "text-red-600",
          title: "text-red-900",
          text: "text-red-800",
        };

      case "warning":
        return {
          container: "border-amber-200 bg-amber-50",
          icon: "text-amber-600",
          title: "text-amber-900",
          text: "text-amber-800",
        };

      case "info":
      default:
        return {
          container: "border-blue-200 bg-blue-50",
          icon: "text-blue-600",
          title: "text-blue-900",
          text: "text-blue-800",
        };
    }
  };

  const renderSeverityIcon = (
    severity: PatientSafetyAlert["severity"]
  ) => {
    if (severity === "critical") {
      return (
        <ShieldAlert
          size={21}
          className="mt-0.5 flex-shrink-0 text-red-600"
        />
      );
    }

    if (severity === "warning") {
      return (
        <AlertTriangle
          size={21}
          className="mt-0.5 flex-shrink-0 text-amber-600"
        />
      );
    }

    return (
      <Info
        size={21}
        className="mt-0.5 flex-shrink-0 text-blue-600"
      />
    );
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <ShieldAlert
              size={22}
              className="text-red-600"
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">
              Patient Safety Layer
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              Patient-Specific Alerts
            </h3>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          These alerts are generated from the patient's
          recorded allergies, conditions, age, and current
          medications. They are screening signals and require
          clinical review.
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-3 sm:grid-cols-3">
        {criticalCount > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-600">
              Critical
            </p>

            <p className="mt-1 text-2xl font-bold text-red-800">
              {criticalCount}
            </p>
          </div>
        )}

        {warningCount > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
              Warnings
            </p>

            <p className="mt-1 text-2xl font-bold text-amber-800">
              {warningCount}
            </p>
          </div>
        )}

        {infoCount > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Review
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-800">
              {infoCount}
            </p>
          </div>
        )}
      </div>

      {/* ALERT LIST */}
      <div className="space-y-3">
        {alerts.map(
          (
            alert: PatientSafetyAlert,
            index: number
          ) => {
            const styles = getSeverityStyles(
              alert.severity
            );

            return (
              <div
                key={`${alert.type}-${index}`}
                className={`rounded-xl border p-5 ${styles.container}`}
              >
                <div className="flex items-start gap-3">
                  {renderSeverityIcon(alert.severity)}

                  <div className="min-w-0 flex-1">
                    {/* TITLE + SEVERITY */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`font-bold ${styles.title}`}
                      >
                        {alert.title}
                      </h4>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${styles.text}`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    {/* MESSAGE */}
                    <p
                      className={`mt-2 text-sm leading-6 ${styles.text}`}
                    >
                      {alert.message}
                    </p>

                    {/* MATCHED VALUE */}
                    {alert.matchedValue && (
                      <div className="mt-3 rounded-lg bg-white/70 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Matched Information
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {alert.matchedValue}
                        </p>
                      </div>
                    )}

                    {/* EVIDENCE */}
                    {alert.evidence && (
                      <div className="mt-2">
                        <p
                          className={`text-xs ${styles.text}`}
                        >
                          {alert.evidence}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* DISCLAIMER */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs leading-5 text-slate-600">
          <strong>Clinical review:</strong> These alerts are
          screening signals based on recorded patient
          information. They are not diagnoses, definitive
          contraindication determinations, or prescribing
          recommendations.
        </p>
      </div>
    </div>
  );
}

export default PatientSafetyAlerts;