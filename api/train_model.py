"""Train and evaluate the medicine-feature multi-label ADR classifier."""
import argparse
import gc
import json
import os
import sys
import tempfile
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from scipy import sparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    hamming_loss,
    precision_score,
    recall_score,
)
from sklearn.multiclass import OneVsRestClassifier
from sklearn.svm import LinearSVC
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import MultiLabelBinarizer

from services.feature_builder import (
    build_medicine_text,
    clean_text,
    normalize_medicine_name,
)

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATA = BASE_DIR / "model" / "medicine_dataset_cleaned.csv"
DEFAULT_MODEL = BASE_DIR / "model" / "adr_model.joblib"
DEFAULT_REPORT = BASE_DIR / "model" / "training_report.json"
DEFAULT_RESULTS = BASE_DIR / "model" / "model_comparison_results.csv"
SIDE_EFFECT_COLUMNS = [f"sideEffect{i}" for i in range(42)]
USE_COLUMNS = [f"use{i}" for i in range(5)]
MODEL_LABELS = {
    "balanced_linear_svc": "class-balanced one-vs-rest LinearSVC",
    "balanced_logistic_regression": "class-balanced one-vs-rest LogisticRegression",
    "balanced_sgd_hinge": "class-balanced one-vs-rest SGD hinge classifier",
}
REQUIRED_COLUMNS = [
    "name",
    *USE_COLUMNS,
    "Therapeutic Class",
    "Action Class",
    "Chemical Class",
    "Habit Forming",
    *SIDE_EFFECT_COLUMNS,
]


def log(message, started):
    elapsed = time.perf_counter() - started
    print(f"[{elapsed:8.1f}s] {message}", flush=True)


def row_features(frame):
    columns = {name: index for index, name in enumerate(frame.columns)}
    texts = []
    labels = []
    for row in frame.itertuples(index=False, name=None):
        medicine = {
            "name": row[columns["name"]],
            "uses": [row[columns[column]] for column in USE_COLUMNS],
            "therapeuticClass": row[columns["Therapeutic Class"]],
            "actionClass": row[columns["Action Class"]],
            "chemicalClass": row[columns["Chemical Class"]],
            "habitForming": row[columns["Habit Forming"]],
        }
        texts.append(build_medicine_text(medicine))
        record_labels = {
            sys.intern(clean_text(row[columns[column]]))
            for column in SIDE_EFFECT_COLUMNS
        }
        record_labels.discard("")
        labels.append(sorted(record_labels))
    return texts, labels


def select_training_rows(frame, max_rows, seed):
    source_rows = len(frame)
    input_columns = [
        "name",
        *USE_COLUMNS,
        "Therapeutic Class",
        "Action Class",
        "Chemical Class",
        "Habit Forming",
    ]
    normalized_names = frame["name"].map(normalize_medicine_name)
    has_name = normalized_names.ne("")
    has_labels = frame[SIDE_EFFECT_COLUMNS].apply(
        lambda column: column.map(clean_text).ne("")
    ).any(axis=1)
    eligible = frame.loc[has_name & has_labels].copy()
    if eligible.empty:
        raise ValueError("Dataset contains no records with a medicine name and ADR label.")

    eligible["_selection_group"] = eligible["name"].map(normalize_medicine_name)
    eligible["_feature_completeness"] = eligible[input_columns].apply(
        lambda column: column.map(clean_text).ne("")
    ).sum(axis=1)
    eligible_groups = int(eligible["_selection_group"].nunique())
    eligible_rows = len(eligible)

    if max_rows is None:
        selected = eligible
        strategy = "all records with a normalized medicine name and at least one ADR label"
    else:
        eligible["_tie_break"] = np.random.default_rng(seed).random(len(eligible))
        selected = (
            eligible.sort_values(
                ["_selection_group", "_feature_completeness", "_tie_break"],
                ascending=[True, False, True],
                kind="stable",
            )
            .drop_duplicates("_selection_group")
            .sort_values(
                ["_feature_completeness", "_tie_break"],
                ascending=[False, True],
                kind="stable",
            )
            .head(max_rows)
        )
        strategy = (
            "highest model-input completeness; one row per normalized medicine name; "
            "seeded tie-break"
        )

    completeness_counts = {
        str(int(value)): int(count)
        for value, count in selected["_feature_completeness"].value_counts().items()
    }
    summary = {
        "source_dataset_rows": int(source_rows),
        "eligible_source_rows": int(eligible_rows),
        "eligible_medicine_name_groups": eligible_groups,
        "selected_records": int(len(selected)),
        "selection_strategy": strategy,
        "selected_records_by_feature_completeness": completeness_counts,
    }

    selected = selected.drop(
        columns=["_selection_group", "_feature_completeness", "_tie_break"],
        errors="ignore",
    )
    if max_rows is not None:
        selected = selected.sample(frac=1, random_state=seed)
    return selected.reset_index(drop=True), summary


def split_groups(groups, seed):
    outer = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=seed)
    train_indices, heldout_indices = next(
        outer.split(np.zeros(len(groups)), groups=groups)
    )
    heldout_groups = groups[heldout_indices]
    inner = GroupShuffleSplit(n_splits=1, test_size=0.5, random_state=seed + 1)
    val_relative, test_relative = next(
        inner.split(np.zeros(len(heldout_indices)), groups=heldout_groups)
    )
    return (
        train_indices,
        heldout_indices[val_relative],
        heldout_indices[test_relative],
    )


def predict_scores(classifier, features):
    scores = classifier.decision_function(features)
    if np.ndim(scores) == 1:
        scores = np.asarray(scores).reshape(-1, 1)
    return np.asarray(scores)


def build_classifier(name, seed, jobs):
    if name == "balanced_linear_svc":
        estimator = LinearSVC(
            class_weight="balanced",
            max_iter=5000,
            random_state=seed,
        )
    elif name == "balanced_logistic_regression":
        estimator = LogisticRegression(
            class_weight="balanced",
            max_iter=1000,
            random_state=seed,
            solver="liblinear",
        )
    elif name == "balanced_sgd_hinge":
        estimator = SGDClassifier(
            class_weight="balanced",
            loss="hinge",
            max_iter=1000,
            random_state=seed,
            tol=1e-3,
        )
    else:
        raise ValueError(f"Unknown candidate model: {name}")
    return OneVsRestClassifier(estimator, n_jobs=jobs)


def metrics_at_threshold(truth, scores, threshold):
    predicted = sparse.csr_matrix(scores >= threshold)
    return {
        "exact_match_accuracy": float(accuracy_score(truth, predicted)),
        "micro_f1": float(f1_score(truth, predicted, average="micro", zero_division=0)),
        "macro_f1": float(f1_score(truth, predicted, average="macro", zero_division=0)),
        "micro_precision": float(precision_score(truth, predicted, average="micro", zero_division=0)),
        "micro_recall": float(recall_score(truth, predicted, average="micro", zero_division=0)),
        "hamming_loss": float(hamming_loss(truth, predicted)),
        "mean_predicted_labels": float(predicted.sum(axis=1).mean()),
    }


def choose_threshold(truth, scores):
    candidates = (-1.0, -0.75, -0.5, -0.25, 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1.0, 1.5)
    evaluated = [
        (float(f1_score(truth, sparse.csr_matrix(scores >= threshold), average="micro", zero_division=0)), threshold)
        for threshold in candidates
    ]
    best_f1 = max(score for score, _ in evaluated)
    return float(min((threshold for score, threshold in evaluated if score == best_f1), key=abs))


def majority_baseline(train_truth, test_truth):
    frequencies = np.asarray(train_truth.sum(axis=0)).ravel()
    labels_per_record = max(1, int(round(float(train_truth.sum(axis=1).mean()))))
    selected = np.argsort(frequencies)[::-1][:labels_per_record]
    predicted = sparse.csr_matrix(
        np.tile(np.isin(np.arange(train_truth.shape[1]), selected), (test_truth.shape[0], 1))
    )
    return metrics_at_threshold(test_truth, predicted.toarray(), 0.5)


def save_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2), encoding="utf-8")
    os.replace(temporary, path)


def save_model(path, artifact, backup=True):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        prefix=f".{path.stem}.", suffix=".joblib", dir=path.parent, delete=False
    ) as handle:
        temporary = Path(handle.name)
    try:
        joblib.dump(artifact, temporary, compress=3)
        if backup and path.exists():
            backup_path = path.with_name(f"{path.stem}.previous{path.suffix}")
            backup_path.write_bytes(path.read_bytes())
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--model-out", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--report-out", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--results-out", type=Path, default=DEFAULT_RESULTS)
    parser.add_argument("--min-label-frequency", type=int, default=20)
    parser.add_argument("--max-rows", type=int, default=None, help="Limit rows for a smoke test; do not report its metrics.")
    parser.add_argument(
        "--allow-smoke-test-model",
        action="store_true",
        help="Allow a --max-rows model to replace the production artifact after preserving its backup.",
    )
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--jobs", type=int, default=-1)
    parser.add_argument("--max-features", type=int, default=40000)
    parser.add_argument("--no-backup", action="store_true")
    args = parser.parse_args()
    if args.min_label_frequency < 2:
        parser.error("--min-label-frequency must be at least 2")
    if args.max_rows is not None and args.max_rows < 100:
        parser.error("--max-rows must be at least 100")
    if args.max_rows is not None and args.model_out.resolve() == DEFAULT_MODEL.resolve() and not args.allow_smoke_test_model:
        parser.error(
            "A --max-rows run cannot replace the production model unless "
            "--allow-smoke-test-model is explicitly supplied."
        )

    started = time.perf_counter()
    log("Loading cleaned medicine/ADR dataset", started)
    if not args.data.is_file():
        raise FileNotFoundError(f"Dataset not found: {args.data}")
    frame = pd.read_csv(args.data, usecols=REQUIRED_COLUMNS, low_memory=False)
    missing = [column for column in REQUIRED_COLUMNS if column not in frame.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")
    frame, selection_summary = select_training_rows(
        frame,
        args.max_rows,
        args.seed,
    )
    if args.max_rows is not None:
        print(
            f"Selected {len(frame):,} records from "
            f"{selection_summary['eligible_source_rows']:,} eligible records using "
            f"{selection_summary['selection_strategy']}.",
            flush=True,
        )
        print(
            "WARNING: a limited-record model is a smoke test, not clinical validation "
            "or project evaluation evidence.",
            flush=True,
        )

    dataset_rows = len(frame)
    log(f"Extracting model features and side-effect labels from {dataset_rows:,} rows", started)
    texts, row_labels = row_features(frame)
    groups = frame["name"].map(normalize_medicine_name).to_numpy()
    del frame
    gc.collect()
    train_indices, val_indices, test_indices = split_groups(groups, args.seed)
    train_name_groups = set(groups[train_indices])
    val_name_groups = set(groups[val_indices])
    test_name_groups = set(groups[test_indices])
    if train_name_groups & val_name_groups or train_name_groups & test_name_groups or val_name_groups & test_name_groups:
        raise RuntimeError("Medicine-name group leakage detected across data splits.")

    training_counts = Counter(
        label for index in train_indices for label in row_labels[index]
    )
    all_counts = Counter(label for labels in row_labels for label in labels)
    classes = sorted(
        label for label, count in all_counts.items()
        if count >= args.min_label_frequency
        and 0 < training_counts.get(label, 0) < len(train_indices)
    )
    if len(classes) < 2:
        raise ValueError(f"Only {len(classes)} usable ADR labels remain after filtering.")
    dropped_labels = len(all_counts) - len(classes)
    retained = set(classes)
    row_labels = [[label for label in labels if label in retained] for labels in row_labels]
    labeler = MultiLabelBinarizer(classes=classes, sparse_output=True)
    targets = labeler.fit_transform(row_labels).tocsr()

    empty_rows = np.asarray(targets.sum(axis=1)).ravel() == 0
    records_excluded_by_label_frequency = int(empty_rows.sum())
    if empty_rows.any():
        train_indices = train_indices[~empty_rows[train_indices]]
        val_indices = val_indices[~empty_rows[val_indices]]
        test_indices = test_indices[~empty_rows[test_indices]]
        if not len(train_indices) or not len(val_indices) or not len(test_indices):
            raise ValueError("A grouped split has no records with retained ADR labels.")
        train_name_groups = set(groups[train_indices])
        val_name_groups = set(groups[val_indices])
        test_name_groups = set(groups[test_indices])

    log(
        f"Grouped split: train={len(train_indices):,}, validation={len(val_indices):,}, "
        f"test={len(test_indices):,}; labels={len(classes):,}; dropped labels={dropped_labels:,}",
        started,
    )

    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        min_df=2,
        max_features=args.max_features,
        strip_accents="unicode",
        sublinear_tf=True,
        dtype=np.float32,
    )
    log("Fitting character n-gram TF-IDF on training partition only", started)
    train_features = vectorizer.fit_transform([texts[index] for index in train_indices])
    validation_features = vectorizer.transform([texts[index] for index in val_indices])
    test_features = vectorizer.transform([texts[index] for index in test_indices])

    candidate_names = (
        "balanced_linear_svc",
        "balanced_logistic_regression",
        "balanced_sgd_hinge",
    )
    validation_comparison = []
    selected_name = None
    selected_threshold = None
    selected_validation_metrics = None
    selected_validation_key = None

    for candidate_name in candidate_names:
        log(
            f"Training validation candidate {candidate_name} "
            f"({len(classes):,} ADR labels)",
            started,
        )
        classifier = build_classifier(candidate_name, args.seed, args.jobs)
        classifier.fit(train_features, targets[train_indices])
        validation_scores = predict_scores(classifier, validation_features)
        candidate_threshold = choose_threshold(
            targets[val_indices], validation_scores
        )
        candidate_metrics = metrics_at_threshold(
            targets[val_indices], validation_scores, candidate_threshold
        )
        validation_comparison.append({
            "model": candidate_name,
            "threshold": candidate_threshold,
            **candidate_metrics,
        })
        candidate_key = (
            candidate_metrics["micro_f1"],
            candidate_metrics["macro_f1"],
            -candidate_metrics["hamming_loss"],
        )
        if selected_validation_key is None or candidate_key > selected_validation_key:
            selected_name = candidate_name
            selected_threshold = candidate_threshold
            selected_validation_metrics = candidate_metrics
            selected_validation_key = candidate_key
        del classifier, validation_scores
        gc.collect()

    if (
        selected_name is None
        or selected_threshold is None
        or selected_validation_metrics is None
    ):
        raise RuntimeError("No candidate model completed validation.")
    log(
        f"Selected {selected_name} using validation Micro-F1 "
        f"({selected_validation_metrics['micro_f1']:.3f}); "
        "held-out test data was not used for selection",
        started,
    )

    log("Refitting classifier on train + validation; test partition remains untouched", started)
    train_validation_indices = np.concatenate((train_indices, val_indices))
    final_classifier = build_classifier(selected_name, args.seed, args.jobs)
    train_validation_features = sparse.vstack(
        (train_features, validation_features), format="csr"
    )
    final_classifier.fit(
        train_validation_features, targets[train_validation_indices]
    )

    log("Evaluating the held-out grouped test partition", started)
    test_scores = predict_scores(final_classifier, test_features)
    test_metrics = metrics_at_threshold(
        targets[test_indices], test_scores, selected_threshold
    )
    baseline_metrics = majority_baseline(
        targets[train_validation_indices], targets[test_indices]
    )
    results = [
        *[
            {"evaluation": "validation", **candidate}
            for candidate in validation_comparison
        ],
        {
            "evaluation": "grouped_test_selected_model",
            "model": selected_name,
            "threshold": selected_threshold,
            **test_metrics,
        },
        {
            "evaluation": "grouped_test",
            "model": "most_frequent_label_baseline",
            "threshold": None,
            **baseline_metrics,
        },
    ]
    print("Grouped held-out evaluation complete; the test partition was not used for threshold selection.", flush=True)

    metadata = {
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset": args.data.name,
        "dataset_rows": int(dataset_rows),
        **selection_summary,
        "records_excluded_by_label_frequency": records_excluded_by_label_frequency,
        "records_used_after_label_filter": int(
            len(train_indices) + len(val_indices) + len(test_indices)
        ),
        "split_method": "GroupShuffleSplit by normalized medicine name (80/10/10)",
        "train_rows": int(len(train_indices)),
        "validation_rows": int(len(val_indices)),
        "test_rows": int(len(test_indices)),
        "train_name_groups": len(train_name_groups),
        "validation_name_groups": len(val_name_groups),
        "test_name_groups": len(test_name_groups),
        "number_of_labels": len(classes),
        "minimum_label_frequency": args.min_label_frequency,
        "labels_dropped": dropped_labels,
        "number_of_features": int(train_features.shape[1]),
        "feature_definition": "medicine name; up to five uses; therapeutic, action, and chemical class; habit-forming status",
        "text_vectorizer": "character TF-IDF, char_wb n-grams (3, 5)",
        "classifier": MODEL_LABELS[selected_name],
        "candidate_models": list(candidate_names),
        "model_selection": "highest validation Micro-F1; Macro-F1 and Hamming loss break ties",
        "threshold_selection": "validation Micro-F1 only, independently for each candidate",
        "score_type": "decision score; not a calibrated probability",
        "scikit_learn_version": sklearn.__version__,
        "smoke_test_only": args.max_rows is not None,
    }
    report = {
        "model_type": f"Grouped Character TF-IDF + {MODEL_LABELS[selected_name]}",
        "selected_model": selected_name,
        "candidate_validation_metrics": validation_comparison,
        "threshold": selected_threshold,
        "validation_metrics": selected_validation_metrics,
        "held_out_test_metrics": test_metrics,
        "baseline_test_metrics": baseline_metrics,
        "training_metadata": metadata,
        "warnings": [
            "Medicine-name grouping does not separate active ingredients or therapeutic classes.",
            "This is not clinical validation; source labels may contain noise and bias.",
            "Classifier decision scores are not calibrated probabilities or patient-specific risk estimates.",
        ],
    }
    artifact = {
        "vectorizer": vectorizer,
        "classifier": final_classifier,
        "classes": np.asarray(classes, dtype=object),
        "threshold": selected_threshold,
        "model_type": report["model_type"],
        "training_metadata": metadata,
        "metrics": {
            "validation": selected_validation_metrics,
            "held_out_test": test_metrics,
        },
    }

    if args.max_rows is not None:
        report["warnings"].append("Smoke-test output must not be used as the project evaluation model.")
    log("Writing evaluation reports and model artifact", started)
    save_json(args.report_out, report)
    args.results_out.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(results).to_csv(args.results_out, index=False)
    save_model(args.model_out, artifact, backup=not args.no_backup)
    log(f"Training complete. Model: {args.model_out}", started)
    log(f"Report: {args.report_out}", started)
    log(f"Comparison: {args.results_out}", started)
    print(json.dumps(report, indent=2), flush=True)


if __name__ == "__main__":
    main()
