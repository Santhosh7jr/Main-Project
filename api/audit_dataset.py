"""Lightweight dataset audit for the medicine-level ADR training table."""
from pathlib import Path
import argparse
import json
import re
from collections import Counter
import pandas as pd

BASE = Path(__file__).resolve().parent
DEFAULT_DATA = BASE / "model" / "medicine_dataset_cleaned.csv"
SIDE_EFFECT_COLUMNS = [f"sideEffect{i}" for i in range(42)]


def clean(value):
    if value is None or pd.isna(value):
        return ""
    text = re.sub(r"\s+", " ", str(value)).strip().lower()
    return "" if text in {"nan", "none", "null", "n/a", "na"} else text


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--output", type=Path, default=BASE / "model" / "dataset_audit.json")
    args = parser.parse_args()
    df = pd.read_csv(args.data, low_memory=False)
    missing = [col for col in ["name", *SIDE_EFFECT_COLUMNS] if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    normalized_names = df["name"].map(clean).str.replace(r"[^a-z0-9]+", " ", regex=True).str.strip()
    label_counts = Counter()
    label_cardinality = []
    no_labels = 0
    for row in df[SIDE_EFFECT_COLUMNS].itertuples(index=False, name=None):
        labels = {clean(v) for v in row}
        labels.discard("")
        if not labels:
            no_labels += 1
        label_cardinality.append(len(labels))
        label_counts.update(labels)

    result = {
        "dataset": args.data.name,
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "exact_duplicate_rows": int(df.duplicated().sum()),
        "missing_medicine_names": int(df["name"].isna().sum()),
        "unique_normalized_medicine_names": int(normalized_names.nunique()),
        "rows_in_repeated_name_groups": int(normalized_names.duplicated(keep=False).sum()),
        "records_without_side_effect_labels": int(no_labels),
        "unique_adr_labels": int(len(label_counts)),
        "mean_labels_per_record": float(sum(label_cardinality) / max(1, len(label_cardinality))),
        "median_labels_per_record": float(pd.Series(label_cardinality).median()),
        "most_common_labels": [{"label": k, "count": int(v)} for k, v in label_counts.most_common(25)],
        "labels_with_frequency_below_20": int(sum(v < 20 for v in label_counts.values())),
        "interpretation_warning": "This audit describes dataset structure only. It does not establish clinical validity, causal ADR relationships, or independence of related medicines.",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    print(f"\nSaved audit report to: {args.output}")


if __name__ == "__main__":
    main()
