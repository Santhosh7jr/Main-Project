# ADR model training and evaluation

## What this changes

The training pipeline builds a multi-label classifier for the `sideEffect0` through `sideEffect41` labels. The input contains medicine name, up to five uses, therapeutic class, action class, chemical class, and habit-forming metadata. Side-effect columns are targets only and are never included in the input text.

The pipeline uses character n-gram TF-IDF features and compares class-balanced one-vs-rest Linear SVM, logistic regression, and SGD hinge candidates. Training and inference share one feature builder. It groups rows by normalized medicine name before creating train, validation, and test partitions. Each candidate's threshold is selected using validation Micro-F1; the winner is selected using validation Micro-F1 (Macro-F1 and Hamming loss break ties). The held-out test partition is used only once for final evaluation of the selected model, not candidate or threshold selection. It also compares that final result with a most-frequent-label baseline.

**Important limitation:** name-grouping prevents exact normalized names from crossing partitions, but does not guarantee separation by active ingredient, generic drug, or therapeutic class. This is not clinical validation.

## 1. Use Python 3.11 or 3.12

From PowerShell, in the repository root:

```powershell
cd api
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If Python 3.12 is not installed, install it first. Do not use the `venv` folder shipped from another computer; the provided project ZIP intentionally excludes machine-specific environments.

## 2. Audit the dataset (recommended)

```powershell
python audit_dataset.py
```

This writes `api/model/dataset_audit.json` with row counts, duplicate-name-group statistics, label frequencies, and label cardinality. It describes the data; it does not prove clinical validity.

## 3. Train and run the evaluation

```powershell
python train_model.py
```

The dataset is expected at `api/model/medicine_dataset_cleaned.csv`. You can point to another copy with `--data "D:\path\medicine_dataset_cleaned.csv"`.

The full run prints elapsed-time progress, trains on the grouped training partition, selects the threshold on validation data, refits using train plus validation, and reports final metrics on the untouched grouped test partition. It can take several minutes and uses memory.

For a small **smoke test only** (not for a report or demonstration model), use separate output paths:

```powershell
python train_model.py --max-rows 2000 --min-label-frequency 2 --max-features 5000 --jobs 1 --model-out model\smoke_test_model.joblib --report-out model\smoke_test_report.json --results-out model\smoke_test_results.csv
```

Do not use the `--max-rows` model for project evaluation or seminar metrics.
The trainer refuses to write a `--max-rows` run to the production model path unless `--allow-smoke-test-model` is explicitly supplied. This is only for intentionally replacing the app's model with a smoke-test artifact; the original is backed up as `adr_model.previous.joblib`.

For a limited-record smoke test, the trainer prefers the most complete model inputs, selects at most one row per normalized medicine name, and uses the configured seed to break ties. Records must have a name and at least one source ADR label. This avoids spending the small sample on duplicate medicine names; it does not make the subset clinically representative.

To compare candidate models on the 5,000 best-completeness records and intentionally install the selected smoke-test model, run:

```powershell
python train_model.py --max-rows 5000 --min-label-frequency 20 --allow-smoke-test-model --jobs 1
```

The report records the selection criteria and completeness counts, and clearly marks a limited-record run as a smoke test; its metrics are not a project benchmark or clinical validation.

## 4. Outputs

- `api/model/adr_model.joblib`: model artifact loaded by the Flask API. The trainer writes a temporary artifact first and replaces the model only after training finishes.
- `api/model/adr_model.previous.joblib`: backup of the existing artifact, when one exists and backup is enabled.
- `api/model/training_report.json`: split sizes, model configuration, selected threshold, and held-out test metrics.
- `api/model/model_comparison_results.csv`: validation comparison for all candidates and held-out evaluation of the selected model versus the simple baseline.

Metrics reported: exact-match accuracy, Micro-F1, Macro-F1, Micro precision/recall, Hamming loss, and mean predicted labels per record. For multi-label data, no single metric tells the full story. Read Micro-F1 and Macro-F1 together and compare against the simple baseline.

## 5. Start and verify the app

Restart Flask after training so the new artifact is loaded:

```powershell
python app.py
```

Check `http://127.0.0.1:5001/api/model-info`. The response reports model readiness, type, threshold, class count, and training metadata. Make a test assessment through the existing app and confirm dataset-known side effects and model-predicted ADRs appear in separate sections. If the model is missing, `/api/model-info` and `/api/predict` return an explicit service error while the Express assessment can still return known side effects.

## 6. Interpretation rules

- SVM decision scores are **not probabilities**. Do not call a score of 0.8 an 80% chance.
- The model uses medicine features only; patient fields do not personalize its predictions.
- The model predicts labels associated with medicine records. It does not confirm that a reaction will happen to a specific patient.
- A missing prediction does not mean a medicine is free of adverse effects.
- `substitute0`–`substitute4` values are dataset-listed substitutes, not evidence that an alternative is safer or clinically equivalent.
- Do not report the current model-comparison CSV as a valid final benchmark unless it was generated by this training script and the dataset/split are documented.
