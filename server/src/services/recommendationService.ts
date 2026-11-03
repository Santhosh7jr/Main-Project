import pool from "../config/database.js";
import { generateJson } from "./llmService.js";
import { getPatientById } from "./patientService.js";

interface RecommendMedicinesInput {
  patientId: number;
  doctorId: number;
  problems: string[];
  sideEffects: string[];
}

interface MedicineCandidate {
  id: number;
  name: string;
  genericName: string | null;
  matchedUses: string[];
  totalCount: number;
}

interface ExpandedTerms {
  problemTerms: string[];
  sideEffectTerms: string[];
  commonSymptoms: string;
}

interface RankedMedicine {
  medicineId: number;
  score: number;
  matchedUse: string;
}

export interface MedicineRecommendation {
  medicine: {
    id: number;
    name: string;
    genericName: string | null;
  };
  similarityPercent: number;
  matchedUses: string[];
  knownSideEffectMatches: string[];
}

export interface MedicineRecommendations {
  recommendations: MedicineRecommendation[];
  totalCandidates: number;
  analyzedCandidates: number;
  rankingMethod: "ai" | "database";
  notice: string | null;
  commonSymptoms: string;
}

const CANDIDATE_LIMIT = 80;

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim().replace(/\s+/g, " ");

const tokens = (value: string) =>
  new Set(normalize(value).split(" ").filter((token) => token.length > 1));

const databaseScore = (problems: string[], uses: string[]) => {
  const scores = problems.map((problem) => {
    const problemText = normalize(problem);
    const problemTokens = tokens(problem);
    return Math.max(
      0,
      ...uses.map((use) => {
        const useText = normalize(use);
        if (problemText === useText) {
          return 1;
        }
        if (problemText.includes(useText) || useText.includes(problemText)) {
          return 0.9;
        }

        const useTokens = tokens(use);
        const overlap = [...problemTokens].filter((token) =>
          useTokens.has(token),
        ).length;
        const union = new Set([...problemTokens, ...useTokens]).size;
        return union === 0 ? 0 : overlap / union;
      }),
    );
  });

  return Math.round(
    (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100,
  );
};

const requestModelJson = async <T>(
  systemPrompt: string,
  userData: Record<string, unknown>,
): Promise<T> => (await generateJson<T>(systemPrompt, userData)).data;

const expandTerms = async (
  problems: string[],
  sideEffects: string[],
): Promise<ExpandedTerms> => {
  const result = await requestModelJson<
    Partial<ExpandedTerms>
  >(
    [
      "You normalize clinical text into database search terms.",
      "Return JSON with problemTerms and sideEffectTerms (arrays of short strings), and commonSymptoms (one short plain-text paragraph).",
      "Include the original concepts and common clinical synonyms or plain-language equivalents.",
      "For a clearly named disease or condition in problems, summarize common associated symptoms in commonSymptoms.",
      "If problems already describe symptoms without naming a disease, or no disease can be identified confidently, return an empty commonSymptoms string instead of inferring a diagnosis.",
      "Describe general educational information only; do not imply the patient has any symptom not reported.",
      "Do not infer a diagnosis, suggest medicines, add unrelated concepts, or include explanations.",
      "Return at most 12 terms per array; side-effect terms must describe the reported effects only. Keep commonSymptoms under 80 words.",
    ].join(" "),
    { problems, sideEffects },
  );

  const validateTerms = (terms: unknown, fallback: string[]) => {
    if (!Array.isArray(terms) || !terms.every(
      (term) => typeof term === "string" && term.trim().length > 0,
    )) {
      throw new Error("Gemini returned invalid search terms.");
    }

    return [...new Set([...fallback, ...terms]
      .map((term) => term.trim().slice(0, 100))
      .filter(Boolean))]
      .slice(0, 20);
  };

  let commonSymptoms =
    typeof result.commonSymptoms === "string"
      ? result.commonSymptoms.trim().slice(0, 1000)
      : "";
  if (!commonSymptoms) {
    commonSymptoms = await getCommonSymptomsWithRetry(problems);
  }

  return {
    problemTerms: validateTerms(result.problemTerms, problems),
    sideEffectTerms: validateTerms(result.sideEffectTerms, sideEffects),
    commonSymptoms,
  };
};

const getCommonSymptomsWithRetry = async (problems: string[]) => {
  const prompt = [
    "Summarize common symptoms associated with the clearly named disease or condition in the supplied problem text.",
    "Return JSON with one string field named commonSymptoms, as a concise paragraph of at most 80 words.",
    "If the text only describes symptoms, is ambiguous, or does not clearly name a recognized condition, return an empty string; do not infer a diagnosis.",
    "This is general educational information, not a statement about the patient and not medical advice.",
  ].join(" ");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await requestModelJson<{ commonSymptoms?: unknown }>(
        prompt,
        { problems },
      );
      if (
        typeof result.commonSymptoms === "string" &&
        result.commonSymptoms.trim()
      ) {
        return result.commonSymptoms.trim().slice(0, 1000);
      }
    } catch (error) {
      console.warn(
        `Gemini common-symptom summary attempt ${attempt + 1} failed.`,
        error instanceof Error ? error.message : "Unknown Gemini error.",
      );
    }
  }

  return "";
};

const rankCandidates = async (
  problems: string[],
  sideEffects: string[],
  candidates: MedicineCandidate[],
  effectsByMedicine: Map<number, string[]>,
): Promise<RankedMedicine[]> => {
  const candidateData = candidates.map((candidate) => ({
    medicineId: candidate.id,
    name: candidate.name,
    genericName: candidate.genericName,
    databaseUses: candidate.matchedUses,
    knownSideEffectMatches: effectsByMedicine.get(candidate.id) ?? [],
  }));
  const result = await requestModelJson<
    { matches?: RankedMedicine[] } | RankedMedicine[]
  >(
    [
      "You rank medicine database records for clinician review.",
      "Only use the supplied medicine IDs and databaseUses; never invent or add medicines.",
      "Return JSON with matches, containing every supplied medicineId exactly once.",
      "For each match, return medicineId, score as an integer from 0 to 100, and matchedUse copied exactly from that record's databaseUses.",
      "Score relevance of the described problem to the listed database uses, not chance of treatment success.",
      "Reported side effects are safety warnings only; do not treat them as indications or as a reason to recommend a medicine.",
      "Do not give dosing, treatment instructions, diagnoses, or medical advice.",
    ].join(" "),
    {
      problems,
      reportedSideEffects: sideEffects,
      candidateMedicines: candidateData,
    },
  );

  const matches = Array.isArray(result) ? result : result.matches;
  if (!Array.isArray(matches)) {
    throw new Error("Gemini returned invalid medicine rankings.");
  }

  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const seenIds = new Set<number>();
  const ranked: RankedMedicine[] = [];

  for (const match of matches) {
    if (
      !match ||
      !Number.isInteger(match.medicineId) ||
      !candidateById.has(match.medicineId) ||
      seenIds.has(match.medicineId) ||
      !Number.isInteger(match.score) ||
      match.score < 0 ||
      match.score > 100
    ) {
      throw new Error("Gemini returned an invalid or duplicate medicine ranking.");
    }

    const candidate = candidateById.get(match.medicineId)!;
    if (
      typeof match.matchedUse !== "string" ||
      !candidate.matchedUses.includes(match.matchedUse)
    ) {
      throw new Error("Gemini returned a medicine match without valid database evidence.");
    }

    seenIds.add(match.medicineId);
    ranked.push(match);
  }

  if (seenIds.size !== candidates.length) {
    throw new Error("Gemini did not rank every database medicine candidate.");
  }

  return ranked;
};

export const recommendMedicines = async ({
  patientId,
  doctorId,
  problems,
  sideEffects,
}: RecommendMedicinesInput): Promise<MedicineRecommendations> => {
  const patient = await getPatientById(patientId, doctorId);
  if (!patient) {
    throw new Error("Patient not found.");
  }

  let expandedTerms: ExpandedTerms;
  let aiAvailable = true;
  try {
    expandedTerms = await expandTerms(problems, sideEffects);
  } catch (error) {
    aiAvailable = false;
    expandedTerms = {
      problemTerms: problems,
      sideEffectTerms: sideEffects,
      commonSymptoms: await getCommonSymptomsWithRetry(problems),
    };
    console.warn(
      "AI term expansion failed; using entered terms for database matching.",
      error instanceof Error ? error.message : "Unknown Gemini error.",
    );
  }
  const candidateResult = await pool.query<MedicineCandidate>(
    `
    WITH problem_terms AS (
      SELECT DISTINCT trim(term) AS term
      FROM unnest($1::text[]) AS input(term)
      WHERE length(trim(term)) >= 2
    ),
    matched_uses AS (
      SELECT DISTINCT
        medicine_uses.medicine_id,
        medicine_uses.use_name,
        problem_terms.term
      FROM medicine_uses
      CROSS JOIN problem_terms
      WHERE to_tsvector('english', medicine_uses.use_name)
        @@ plainto_tsquery('english', problem_terms.term)
    )
    SELECT
      medicines.id,
      medicines.name,
      medicines.generic_name AS "genericName",
      array_agg(DISTINCT matched_uses.use_name) AS "matchedUses",
      COUNT(DISTINCT matched_uses.term)::int AS "matchedTermCount",
      COUNT(*) OVER()::int AS "totalCount"
    FROM matched_uses
    JOIN medicines ON medicines.id = matched_uses.medicine_id
    GROUP BY medicines.id, medicines.name, medicines.generic_name
    ORDER BY COUNT(DISTINCT matched_uses.term) DESC, medicines.name
    LIMIT $2
    `,
    [expandedTerms.problemTerms, CANDIDATE_LIMIT],
  );

  if (candidateResult.rows.length === 0) {
    return {
      recommendations: [],
      totalCandidates: 0,
      analyzedCandidates: 0,
      rankingMethod: "database",
      notice: aiAvailable
        ? null
        : "AI is unavailable. No database matches were found for the entered terms.",
      commonSymptoms: expandedTerms.commonSymptoms,
    };
  }

  const medicineIds = candidateResult.rows.map((candidate) => candidate.id);
  const sideEffectMatches = expandedTerms.sideEffectTerms.length
    ? await pool.query<{ medicineId: number; sideEffect: string }>(
        `
        WITH side_effect_terms AS (
          SELECT DISTINCT trim(term) AS term
          FROM unnest($1::text[]) AS input(term)
          WHERE length(trim(term)) >= 2
        )
        SELECT DISTINCT
          medicine_side_effects.medicine_id AS "medicineId",
          medicine_side_effects.side_effect_name AS "sideEffect"
        FROM medicine_side_effects
        JOIN side_effect_terms
          ON to_tsvector('english', medicine_side_effects.side_effect_name)
            @@ plainto_tsquery('english', side_effect_terms.term)
        WHERE medicine_side_effects.medicine_id = ANY($2::int[])
        `,
        [expandedTerms.sideEffectTerms, medicineIds],
      )
    : { rows: [] };

  const effectsByMedicine = new Map<number, string[]>();
  for (const match of sideEffectMatches.rows) {
    const matches = effectsByMedicine.get(match.medicineId) ?? [];
    matches.push(match.sideEffect);
    effectsByMedicine.set(match.medicineId, matches);
  }

  let ranked: RankedMedicine[];
  let rankingMethod: MedicineRecommendations["rankingMethod"] = "database";
  let notice: string | null = null;
  if (aiAvailable) {
    try {
      ranked = await rankCandidates(
        problems,
        sideEffects,
        candidateResult.rows,
        effectsByMedicine,
      );
      rankingMethod = "ai";
    } catch (error) {
      console.warn(
        "AI ranking failed; using database text matching.",
        error instanceof Error ? error.message : "Unknown Gemini error.",
      );
      ranked = candidateResult.rows.map((candidate) => ({
        medicineId: candidate.id,
        score: databaseScore(problems, candidate.matchedUses),
        matchedUse: candidate.matchedUses.reduce(
          (best, use) =>
            databaseScore(problems, [use]) >
            databaseScore(problems, [best])
              ? use
              : best,
          candidate.matchedUses[0] ?? "",
        ),
      }));
      notice =
        "AI is temporarily unavailable. These results use database text matching and may be less relevant.";
    }
  } else {
    ranked = candidateResult.rows.map((candidate) => ({
      medicineId: candidate.id,
      score: databaseScore(problems, candidate.matchedUses),
      matchedUse: candidate.matchedUses.reduce(
        (best, use) =>
          databaseScore(problems, [use]) > databaseScore(problems, [best])
            ? use
            : best,
        candidate.matchedUses[0] ?? "",
      ),
    }));
    notice =
      "AI is temporarily unavailable. These results use database text matching and may be less relevant.";
  }
  const candidateById = new Map(
    candidateResult.rows.map((candidate) => [candidate.id, candidate]),
  );
  const recommendations = ranked
    .map((match) => {
      const candidate = candidateById.get(match.medicineId)!;
      return {
        medicine: {
          id: candidate.id,
          name: candidate.name,
          genericName: candidate.genericName,
        },
        similarityPercent: match.score,
        matchedUses: [match.matchedUse],
        knownSideEffectMatches: effectsByMedicine.get(candidate.id) ?? [],
      };
    })
    .sort(
      (first, second) =>
        second.similarityPercent - first.similarityPercent ||
        first.medicine.name.localeCompare(second.medicine.name),
    );

  return {
    recommendations,
    totalCandidates: candidateResult.rows[0].totalCount,
    analyzedCandidates: candidateResult.rows.length,
    rankingMethod,
    notice,
    commonSymptoms: expandedTerms.commonSymptoms,
  };
};
