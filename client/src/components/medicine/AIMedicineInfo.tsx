import type { AIMedicineEnrichment } from "../../types/medicine";

interface AIMedicineInfoProps {
  medicineName: string;
  fields: AIMedicineEnrichment["fields"];
}

function AIMedicineInfo({
  medicineName,
  fields,
}: AIMedicineInfoProps) {
  const entries = [
    ["Generic name", fields.genericName],
    ["Therapeutic class", fields.therapeuticClass],
    ["Action class", fields.actionClass],
    ["Chemical class", fields.chemicalClass],
    [
      "Habit-forming information",
      fields.habitForming === undefined
        ? undefined
        : fields.habitForming
          ? "AI indicates habit-forming"
          : "AI indicates not habit-forming",
    ],
    ["Possible uses", fields.uses?.join(", ")],
    ["Possible side effects", fields.sideEffects?.join(", ")],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="font-semibold text-amber-900">{medicineName}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
        AI-generated information · verify before use
      </p>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-amber-900">
          The AI could not provide reliable supplementary details for the missing fields.
        </p>
      ) : (
        <dl className="mt-3 space-y-2">
          {entries.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium text-amber-800">{label}</dt>
              <dd className="text-sm text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export default AIMedicineInfo;
