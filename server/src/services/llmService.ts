import axios from "axios";
import { env } from "../config/env.js";

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
}

interface GeminiModelsResponse {
  models?: {
    name?: string;
    supportedGenerationMethods?: string[];
  }[];
}

interface GeminiErrorResponse {
  error?: {
    message?: string;
    status?: string;
  };
}

const normalizeModelName = (name: string) => name.replace(/^models\//, "");

const getAvailableFlashModel = async (excludedModel: string) => {
  const response = await axios.get<GeminiModelsResponse>(
    "https://generativelanguage.googleapis.com/v1beta/models",
    {
      timeout: 10000,
      headers: {
        "x-goog-api-key": env.geminiApiKey!,
      },
    },
  );
  const models = (response.data.models ?? [])
    .filter((model) =>
      model.name && model.supportedGenerationMethods?.includes("generateContent"),
    )
    .map((model) => normalizeModelName(model.name!))
    .filter((model) => model !== excludedModel);

  const versionedFlashModels = models
    .filter((model) => /^gemini-\d+(?:\.\d+)?-flash(?:-lite)?$/i.test(model))
    .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }));
  const stableFlashModel = versionedFlashModels.find(
    (model) => model === "gemini-3.5-flash-lite",
  );
  if (stableFlashModel) {
    return stableFlashModel;
  }
  if (versionedFlashModels.length > 0) {
    return versionedFlashModels[0];
  }

  const flashModel =
    models.find((model) => model === "gemini-flash-latest") ??
    models.find(
      (model) =>
        /flash/i.test(model) && !/(preview|image|tts)/i.test(model),
    );
  if (flashModel) {
    return flashModel;
  }

  throw new Error(
    "The configured Gemini API key has no available generateContent Flash model.",
  );
};

const generateContent = (
  model: string,
  systemPrompt: string,
  userData: Record<string, unknown>,
  maxOutputTokens?: number,
) =>
  axios.post<GeminiResponse>(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(normalizeModelName(model))}:generateContent`,
    {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [{
        role: "user",
        parts: [{ text: JSON.stringify(userData) }],
      }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        ...(maxOutputTokens ? { maxOutputTokens } : {}),
      },
    },
    {
      timeout: 20000,
      headers: {
        "x-goog-api-key": env.geminiApiKey!,
        "Content-Type": "application/json",
      },
    },
  );

export const generateJson = async <T>(
  systemPrompt: string,
  userData: Record<string, unknown>,
  options: { maxOutputTokens?: number } = {},
): Promise<{ data: T; provider: "Gemini" }> => {
  if (!env.geminiApiKey) {
    throw new Error("Gemini is not configured. Add gemini_api_key to server/.env.");
  }

  let response;
  let model = normalizeModelName(env.geminiModel);
  try {
    response = await generateContent(
      model,
      systemPrompt,
      userData,
      options.maxOutputTokens,
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as GeminiErrorResponse | undefined;
      const providerStatus = data?.error?.status;
      console.error("Gemini AI request failed.", { status, providerStatus });

      if (status === 404 || providerStatus === "NOT_FOUND") {
        try {
          model = await getAvailableFlashModel(model);
          console.warn(`Configured Gemini model unavailable; retrying with ${model}.`);
          response = await generateContent(
            model,
            systemPrompt,
            userData,
            options.maxOutputTokens,
          );
        } catch (retryError) {
          if (axios.isAxiosError(retryError)) {
            console.error("Gemini fallback model request failed.", {
              status: retryError.response?.status,
              providerStatus: (
                retryError.response?.data as GeminiErrorResponse | undefined
              )?.error?.status,
            });
          }
          throw new Error(
            retryError instanceof Error
              ? `Gemini fallback model request failed: ${retryError.message}`
              : "Gemini could not find an available model.",
          );
        }
      } else {
        if (status === 401 || status === 403) {
          throw new Error("Gemini rejected the configured API key or denied access.");
        }
        if (status === 429) {
          throw new Error(
            "Gemini request quota or rate limit was reached. Check the Gemini API quota and try again later.",
          );
        }
        throw new Error("Gemini could not process the AI request.");
      }
    } else {
      console.error("Gemini AI request failed.");
      throw new Error("Gemini could not process the AI request.");
    }
  }

  const content = response.data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!content) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    return {
      data: JSON.parse(content) as T,
      provider: "Gemini",
    };
  } catch {
    throw new Error("Gemini returned an invalid JSON response.");
  }
};
