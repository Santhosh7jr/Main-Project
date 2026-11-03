# MedGuard ADR Prediction — Seminar and Viva Guide

## 1. The problem we are addressing

Medicine information can be spread across different records. MedGuard brings medicine details, database-documented side effects, ML-estimated ADR labels, patient-record safety checks, and listed substitutes into one workflow for review by a healthcare professional.

The project is an academic decision-support prototype. It does not diagnose an ADR, prescribe a medicine, establish causality, or replace a clinician or authoritative drug reference.

## 2. What the system actually does

1. The doctor selects a patient and a medicine in the React interface.
2. The Express API reads the patient's recorded information and medicine information from PostgreSQL.
3. The Express service sends medicine features to the Flask ML API.
4. The ML model transforms the medicine text with the saved TF-IDF vectorizer and returns ADR labels whose SVM decision scores cross the validation-selected threshold.
5. A separate safety service checks recorded allergies, conditions, age, and current medicines according to its implemented rules.
6. The UI displays database-documented side effects separately from ML-estimated ADRs. The assessment can then be saved to the database.

### Important distinction to state clearly

The model's training targets are side-effect labels attached to medicine records. The current model features are medicine name, listed uses, therapeutic class, action class, chemical class, and habit-forming metadata. Patient age, allergies, conditions, and current medicines are **not features of the ADR classifier**. Patient details are checked by a separate safety-rule layer. Therefore, do not claim that the ML model predicts a personalized ADR probability for each patient.

## 3. ML pipeline in plain language

- **Target:** a multi-label set of side-effect names (`sideEffect0`–`sideEffect41`). A medicine record may have several labels at once.
- **Input text:** medicine name, up to five uses, and available medicine metadata. Target side-effect columns are excluded from the input to avoid direct target leakage.
- **Vectorization:** character n-gram TF-IDF converts text into numerical features. Character fragments can retain useful signals when spelling or brand-name text varies slightly.
- **Classifier:** class-balanced one-vs-rest Linear SVM. It trains one binary decision function per ADR label, with balancing to reduce the dominance of very frequent labels.
- **Threshold:** a decision-score threshold is selected on the validation set using Micro-F1. The held-out test set is not used to choose this threshold.
- **Evaluation:** exact-match accuracy, Micro-F1, Macro-F1, Micro precision/recall, Hamming loss, and mean predicted labels per record. A simple frequent-label baseline is also reported.

## 4. Why the evaluation is more defensible

The earlier reported `model_comparison_results.csv` contains high scores, but the CSV alone does not document the split design, leakage checks, or threshold-selection protocol. Do not present those values as final verified results unless you can reproduce them and explain the methodology.

The training script groups records by normalized medicine name before splitting, so repeated records with the same normalized name do not appear across train/validation/test. It evaluates this grouped split against a most-frequent-label baseline. It does not currently run a random-split comparison or a medicine-name ablation; do not claim those diagnostics were run unless you separately implement and document them.

Name grouping does not guarantee separation by active ingredient or pharmacological class. A stronger future evaluation would group by verified generic/active ingredient and test on an independent external dataset.

## 5. How to explain the metrics

- **Exact-match accuracy:** percentage of records for which the complete predicted set exactly matches the reference label set. It is strict and can be low even when many individual labels are correct.
- **Micro-F1:** combines true positives, false positives, and false negatives across all labels. Frequent labels influence it strongly.
- **Macro-F1:** calculates F1 for each label and averages them. It highlights performance on less frequent labels, but is sensitive to rare labels.
- **Hamming loss:** fraction of individual label decisions that are wrong. Lower is better; a large number of negative label decisions can make this look small, so it must not be used alone.
- **Precision:** among predicted labels, the fraction that match the dataset labels.
- **Recall:** among reference labels, the fraction recovered by the model.
- **Decision score:** the Linear SVM's signed margin-like score. It is not a probability and not a severity score.

Always quote the actual values from `api/model/training_report.json` after your own training run. Never invent or reuse example values as your final result.

## 6. Suggested seminar script

"MedGuard is a web-based academic prototype for organizing medicine information and presenting potential adverse drug reaction labels. The React frontend communicates with an Express API and PostgreSQL database. A separate Flask service hosts a multi-label text-classification model. We represent medicine information with character n-gram TF-IDF and use a class-balanced one-vs-rest Linear SVM to rank candidate ADR labels. The threshold is selected on validation data, and final performance is measured on a held-out test set with medicine names grouped across partitions. We report Micro-F1, Macro-F1, exact-match accuracy, and Hamming loss, and compare the model against a simple frequent-label baseline. The output is an estimate based on dataset associations, not a patient-specific probability or a clinical recommendation. Patient safety checks are a separate rule-based layer. The project requires external and clinical validation before any real-world clinical use."

## 7. Likely viva questions and defensible answers

**Q: Is the system hardware-based?**  
A: No. It is a software application using a web frontend, application server, database, and Python ML API.

**Q: Is the ML model actually used, or are side effects just looked up?**  
A: Both paths exist and must be distinguished. The documented side-effect list is retrieved from database records. The Flask model separately estimates ADR labels from medicine text. The UI now labels these outputs separately.

**Q: Does the model use the patient's age, allergies, or medical history to predict ADRs?**  
A: Not in the ADR classifier's current feature vector. Those details are passed to a separate patient-safety rule layer. We therefore do not call the ADR output a personalized risk prediction.

**Q: Why multi-label classification?**  
A: A single medicine can be associated with multiple side effects, so the target is a set of labels rather than one mutually exclusive class.

**Q: Why Linear SVM?**  
A: It is a practical sparse-text baseline that scales well with TF-IDF features and provides decision scores. Those scores are not probabilities unless a separate calibration procedure is developed and validated.

**Q: Why TF-IDF character n-grams?**  
A: They represent text as weighted fragments and can capture partial spelling/word patterns. They do not understand pharmacology or establish causality.

**Q: How did you prevent data leakage?**  
A: Target side-effect columns are not included as features. The threshold is tuned on validation data, not the test set. The main split groups normalized medicine names. However, we acknowledge that this is not equivalent to grouping by active ingredient and does not rule out all related-product leakage.

**Q: Why not report only accuracy?**  
A: The task is multi-label and imbalanced. Exact-match accuracy is strict, Micro-F1 emphasizes common labels, Macro-F1 gives each label equal weight, and Hamming loss measures individual label errors. Together they provide a fuller picture.

**Q: Are the predictions probabilities?**  
A: No. They are Linear SVM decision scores compared with a threshold selected on validation data. We do not claim calibrated probabilities.

**Q: Can we say an alternative medicine is safer?**  
A: No. The substitute fields are listed by the dataset. They do not prove safety, equivalence, suitability, or superiority for a patient.

**Q: Can a doctor rely on this in practice?**  
A: Not as a standalone clinical tool. It is a research prototype; it requires external validation, clinical review, current authoritative data, and appropriate regulatory/privacy assessment before clinical deployment.

**Q: What are the limitations?**  
A: Dataset quality and coverage; possible product/name overlap; no verified active-ingredient grouped evaluation; no external clinical validation; no calibrated probabilities; and the ADR model is medicine-level rather than patient-specific.

## 8. Demo checklist

- Show a medicine's **known side effects in the dataset** and explain they come from database records.
- Show **model-predicted ADRs** and explain that scores are not probabilities.
- Show the patient-safety alerts separately and explain they come from a separate rule layer.
- Show `GET /api/model-info` and point out the model type, threshold, class count, and training metadata.
- Open `training_report.json` and quote the real held-out grouped test metrics from your run.
- Compare grouped test results with the most-frequent-label baseline in the report.
- Mention one limitation and one concrete next step: evaluation grouped by verified active ingredient and testing on an independent dataset.
