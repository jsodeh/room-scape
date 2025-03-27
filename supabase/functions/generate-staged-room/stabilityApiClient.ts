
import { fetchImage } from "./imageProcessor.ts";
import { prepareStabilityRequest } from "./stabilityRequestBuilder.ts";
import { handleStabilityResponse } from "./stabilityResponseHandler.ts";
import { updateProjectStatus } from "./projectManager.ts";
import { processAndSaveResultImages } from "./imageProcessor.ts";
import { stabilityApiKey } from "./supabaseClient.ts";

// API endpoint for Stability Search and Replace
const STABILITY_API_URL = "https://api.stability.ai/v2beta/searches/replace";

/**
 * Generate a staged room using Stability AI's search-and-replace endpoint
 */
export async function generateStagedRoomWithStability(
  roomImageData: ArrayBuffer,
  prompt: string,
  projectId: string
): Promise<string[]> {
  console.log("Starting Stability AI request for project:", projectId);
  
  try {
    // Update project status to processing
    await updateProjectStatus(projectId, "processing", "Generating staged room with Stability AI");
    
    // Prepare the request with image data and parameters
    const formData = await prepareStabilityRequest(roomImageData, prompt);
    
    // Send request to Stability AI
    console.log("Sending request to Stability API...");
    const response = await fetch(STABILITY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stabilityApiKey}`,
        // Don't set Content-Type here as it's automatically set with FormData
      },
      body: formData
    });
    
    // Process the response from Stability API
    console.log(`Response status: ${response.status} ${response.statusText}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stability API error response:", errorText);
      throw new Error(`Stability API error (status ${response.status}): ${errorText}`);
    }
    
    // Extract the JSON from the response
    const result = await response.json();
    
    // Process the result to get the artifacts
    const artifacts = handleStabilityResponse(result);
    
    // Process and save the generated images
    return await processAndSaveResultImages(artifacts, projectId);
  } catch (error) {
    console.error("Error generating staged room with Stability AI:", error);
    await updateProjectStatus(projectId, "failed", `Stability AI error: ${error.message}`);
    throw error;
  }
}
