# Database migrations

After creating the database and running `database/main.sql`, apply each numbered migration in order. Back up the database before applying schema changes.

```powershell
psql -v ON_ERROR_STOP=1 -d medguard_db -f database/migrations/001_patient_history.sql
psql -v ON_ERROR_STOP=1 -d medguard_db -f database/migrations/002_assessment_medication_link.sql
```

`001_patient_history.sql` is additive and safe to rerun. It preserves existing patient, medication, and assessment rows; historical medication status is initialized from its recorded end date. It does not manufacture missing clinical details.

`002_assessment_medication_link.sql` links each assessment to the exact patient medication record saved with it, so dosage, frequency, and end date appear on the corresponding Reports entry.
