// Selected from the key's live model catalog; operator configuration is explicit.
import { ThinkingLevel } from "npm:@google/genai@2.31.0";
import { HttpError } from "../security.ts";
import type { Quality } from "./contracts.ts";
export const DEFAULT_ANALYSIS_MODEL = "gemini-3.1-flash-lite";
export function analysisModel() {
  return Deno.env.get("GEMINI_ANALYSIS_MODEL") || DEFAULT_ANALYSIS_MODEL;
}
export function analysisRequestConfig(model: string) {
  return {
    maxOutputTokens: 4096,
    thinkingConfig: model.startsWith("gemini-2.5-")
      ? { thinkingBudget: 512 }
      : {
        thinkingLevel: model.includes("flash-lite")
          ? ThinkingLevel.MINIMAL
          : ThinkingLevel.LOW,
      },
  };
}
export type WorkflowAPI = "interactions" | "generateContent";
export function workflowAPI(quality: Quality): WorkflowAPI {
  const configured = quality === "lite"
    ? Deno.env.get("GEMINI_LITE_API") || "generateContent"
    : Deno.env.get("GEMINI_WORKFLOW_API") || "interactions";
  if (configured !== "interactions" && configured !== "generateContent") {
    throw new HttpError(
      503,
      "The Gemini request API is not configured correctly.",
    );
  }
  return configured;
}
