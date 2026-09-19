import re


# ======================================================
# NORMALIZATION
# ======================================================

def normalize(value):
    if value is None:
        return ""

    value = str(value).lower().strip()

    value = re.sub(
        r"[^a-z0-9\s-]",
        " ",
        value,
    )

    value = re.sub(
        r"\s+",
        " ",
        value,
    )

    return value


def tokens(value):
    return {
        token
        for token in normalize(value).split()
        if len(token) >= 3
    }


def meaningful_overlap(first, second):
    first_tokens = tokens(first)
    second_tokens = tokens(second)

    if not first_tokens or not second_tokens:
        return False

    return bool(
        first_tokens.intersection(
            second_tokens
        )
    )


# ======================================================
# ALLERGY CHECK
# ======================================================

def check_allergies(
    patient,
    medicine,
):

    alerts = []

    medicine_name = medicine.get(
        "name",
        "",
    )

    generic_name = medicine.get(
        "genericName",
        "",
    )

    chemical_class = medicine.get(
        "chemicalClass",
        "",
    )


    for allergy in patient.get(
        "allergies",
        [],
    ):

        if not allergy:
            continue


        medicine_match = (
            meaningful_overlap(
                allergy,
                medicine_name,
            )
        )


        generic_match = (
            meaningful_overlap(
                allergy,
                generic_name,
            )
        )


        chemical_match = (
            meaningful_overlap(
                allergy,
                chemical_class,
            )
        )


        if (
            medicine_match
            or generic_match
            or chemical_match
        ):

            if medicine_match:
                evidence = "Medicine name"

            elif generic_match:
                evidence = "Generic medicine name"

            else:
                evidence = "Chemical class"


            alerts.append({

                "type":
                    "allergy",

                "severity":
                    "critical",

                "title":
                    "Potential allergy conflict",

                "message":
                    (
                        f'The patient has a recorded allergy '
                        f'"{allergy}" that matches information '
                        f'associated with {medicine_name}. '
                        f'Clinical review is required before use.'
                    ),

                "matchedValue":
                    allergy,

                "evidence":
                    evidence,
            })


    return alerts


# ======================================================
# CURRENT MEDICATION
# ======================================================

def check_current_medications(
    patient,
    medicine,
):

    alerts = []

    medicine_name = normalize(
        medicine.get(
            "name",
            "",
        )
    )


    generic_name = normalize(
        medicine.get(
            "genericName",
            "",
        )
    )


    for medication in patient.get(
        "medications",
        [],
    ):

        current_name = normalize(
            medication
        )


        if not current_name:
            continue


        same_medicine = (
            current_name ==
            medicine_name
            or
            (
                generic_name
                and
                current_name ==
                generic_name
            )
        )


        if same_medicine:

            alerts.append({

                "type":
                    "current_medication",

                "severity":
                    "warning",

                "title":
                    "Medicine already recorded",

                "message":
                    (
                        f'{medicine.get("name")} is already '
                        f'listed among the patient\'s current '
                        f'medications. Review the intended dosage '
                        f'and frequency before adding or prescribing '
                        f'it again.'
                    ),

                "matchedValue":
                    medication,

                "evidence":
                    "Patient medication history",
            })


    return alerts


# ======================================================
# CONDITION REVIEW
#
# We deliberately do not claim a contraindication here.
# The current dataset does not provide a validated
# patient-condition contraindication mapping.
# ======================================================

def check_conditions(
    patient,
    medicine,
):

    conditions = patient.get(
        "conditions",
        [],
    )


    if not conditions:
        return []


    medicine_name = medicine.get(
        "name",
        "",
    )


    return [{

        "type":
            "condition",

        "severity":
            "info",

        "title":
            "Patient conditions require review",

        "message":
            (
                f'The patient has {len(conditions)} '
                f'recorded condition(s). The current local '
                f'medicine dataset does not provide a validated '
                f'patient-specific contraindication mapping for '
                f'{medicine_name}. Review the patient conditions '
                f'against authoritative prescribing information.'
            ),

        "evidence":
            ", ".join(
                str(condition)
                for condition in conditions
            ),
    }]


# ======================================================
# AGE REVIEW
# ======================================================

def check_age(
    patient,
    medicine,
):

    age = patient.get(
        "age"
    )


    if age is None:
        return []


    try:

        age = int(age)

    except (
        TypeError,
        ValueError,
    ):

        return []


    medicine_name = medicine.get(
        "name",
        "",
    )


    if age >= 65:

        return [{

            "type":
                "age",

            "severity":
                "info",

            "title":
                "Older adult review required",

            "message":
                (
                    f'The patient is {age} years old. '
                    f'Review age-related dosing, renal/hepatic '
                    f'function, polypharmacy, and prescribing '
                    f'information for {medicine_name}.'
                ),

            "matchedValue":
                str(age),

            "evidence":
                "Patient age",
        }]


    if age < 18:

        return [{

            "type":
                "age",

            "severity":
                "info",

            "title":
                "Pediatric review required",

            "message":
                (
                    f'The patient is {age} years old. '
                    f'Confirm pediatric dosing, age restrictions, '
                    f'and prescribing information for '
                    f'{medicine_name}.'
                ),

            "matchedValue":
                str(age),

            "evidence":
                "Patient age",
        }]


    return []


# ======================================================
# MAIN
# ======================================================

def analyze_patient_safety(
    patient,
    medicine,
):

    alerts = []


    alerts.extend(
        check_allergies(
            patient,
            medicine,
        )
    )


    alerts.extend(
        check_current_medications(
            patient,
            medicine,
        )
    )


    alerts.extend(
        check_conditions(
            patient,
            medicine,
        )
    )


    alerts.extend(
        check_age(
            patient,
            medicine,
        )
    )


    critical_count = sum(
        1
        for alert in alerts
        if alert["severity"] ==
        "critical"
    )


    warning_count = sum(
        1
        for alert in alerts
        if alert["severity"] ==
        "warning"
    )


    info_count = sum(
        1
        for alert in alerts
        if alert["severity"] ==
        "info"
    )


    return {

        "hasAlerts":
            len(alerts) > 0,

        "alertCount":
            len(alerts),

        "criticalCount":
            critical_count,

        "warningCount":
            warning_count,

        "infoCount":
            info_count,

        "alerts":
            alerts,

        "summary": {

            "allergyConflict":
                any(
                    alert["type"] ==
                    "allergy"
                    for alert in alerts
                ),

            "currentMedicationConflict":
                any(
                    alert["type"] ==
                    "current_medication"
                    for alert in alerts
                ),

            "conditionReviewRequired":
                any(
                    alert["type"] ==
                    "condition"
                    for alert in alerts
                ),

            "ageReviewRequired":
                any(
                    alert["type"] ==
                    "age"
                    for alert in alerts
                ),
        },
    }