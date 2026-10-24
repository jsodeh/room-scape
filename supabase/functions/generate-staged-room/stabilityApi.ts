
import { stabilityApiKey, geminiApiKey } from "./supabaseClient.ts";
import { generateStagedRoomWithStability } from "./stabilityApiClient.ts";
import { generateStagedRoomWithGemini } from "./geminiApi.ts";

// Function to choose the appropriate API for staging and call it
export async function generateStagedRoom(
  roomImageData: ArrayBuffer,
  prompt: string,
  referenceImageUrl: string | undefined, // This will be ignored in actual staging
  projectId: string
): Promise<string[]> {
  console.log("Choosing API for image generation...");
  
  const provider = Deno.env.get('IMAGE_PROVIDER') || (geminiApiKey ? 'gemini' : 'stability');
  if (provider === 'gemini' && geminiApiKey) {
    console.log("Using Gemini image generation");
    // We're NOT passing referenceImageUrl here anymore
    return await generateStagedRoomWithGemini(roomImageData, prompt, projectId);
  }
  
  // Fall back to Stability AI if Gemini is not available
  if (provider === 'stability' && stabilityApiKey) {
    console.log("Using Stability AI Search and Replace API");
    // We're NOT passing referenceImageUrl here anymore
    return await generateStagedRoomWithStability(roomImageData, prompt, projectId);
  }
  
  throw new Error("No valid API key found. Please configure either STABILITY_API_KEY or GEMINI_API_KEY");
}
