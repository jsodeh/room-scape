
import { updateProjectStatus } from "./projectManager.ts";
import { processAndSaveResultImages } from "./imageProcessor.ts";
import { arrayBufferToBase64 } from "./utils.ts";
import { fetchImage } from "./imageProcessor.ts";

const stabilityApiKey = Deno.env.get("STABILITY_API_KEY") || "";

// Generate staged room using Stability AI v2beta API
export async function generateStagedRoomV2(
  roomImageData: ArrayBuffer, 
  prompt: string, 
  referenceImageUrl: string | undefined, 
  projectId: string
): Promise<string[]> {
  console.log("Using Stability AI v2beta API to generate staged room");
  
  try {
    if (!stabilityApiKey) {
      console.error("STABILITY_API_KEY is not configured in environment variables");
      throw new Error("STABILITY_API_KEY is not set. Please configure it in the Supabase secrets.");
    }
    
    // Log image size which can help diagnose timeouts
    console.log(`Room image size: ${(roomImageData.byteLength / (1024 * 1024)).toFixed(2)}MB`);
    if (roomImageData.byteLength > 8 * 1024 * 1024) {
      console.warn("Large image detected (>8MB). This may cause timeouts in the edge function.");
    }
    
    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    // Create a Blob from the room image data
    const roomImageBlob = new Blob([new Uint8Array(roomImageData)], { type: 'image/jpeg' });
    formData.append('image', roomImageBlob, 'room_image.jpg');
    formData.append('prompt', prompt);
    formData.append('seed', Math.floor(Math.random() * 2147483647).toString());
    formData.append('cfg_scale', '7');
    formData.append('samples', '1');
    
    // Reference image if provided
    if (referenceImageUrl) {
      try {
        const refImageData = await fetchImage(referenceImageUrl, "reference");
        const refImageBlob = new Blob([new Uint8Array(refImageData)], { type: 'image/jpeg' });
        formData.append('reference_image', refImageBlob, 'reference_image.jpg');
        console.log("Added reference image to the request");
        console.log(`Reference image size: ${(refImageData.byteLength / (1024 * 1024)).toFixed(2)}MB`);
      } catch (refError) {
        console.error("Error processing reference image, continuing without it:", refError);
      }
    }
    
    // Log details about the request for better debugging
    console.log("Sending request to Stability AI v2beta API");
    console.log("Using endpoint: search-and-replace");
    console.log("Prompt being sent:", prompt);
    console.log("API Key valid:", stabilityApiKey.length > 0 ? "Yes" : "No");
    
    // Add timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // Reduced timeout to 20 seconds
    
    try {
      // Make request to Stability AI v2beta API with correct Accept header
      const response = await fetch(
        "https://api.stability.ai/v2beta/stable-image/edit/search-and-replace",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${stabilityApiKey}`,
            "Accept": "image/*, application/json" // Add Accept header with correct value
            // Content-Type is automatically set by the FormData
          },
          body: formData,
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      // Detailed error logging for better debugging
      if (!response.ok) {
        const responseBody = await response.text();
        let errorMessage = `Stability API error (status ${response.status})`;
        
        try {
          // Try to parse as JSON for more specific error message
          const errorJson = JSON.parse(responseBody);
          if (errorJson.message) {
            errorMessage += `: ${errorJson.message}`;
          } else if (errorJson.errors && errorJson.errors.length > 0) {
            errorMessage += `: ${errorJson.errors.join(', ')}`;
          } else {
            errorMessage += `: ${responseBody.substring(0, 200)}`;
          }
        } catch (e) {
          // If not valid JSON, use text
          errorMessage += `: ${responseBody.substring(0, 200)}`;
        }
        
        console.error(errorMessage);
        
        // Handle common error codes
        if (response.status === 401) {
          throw new Error("Authentication failed: Invalid API key. Please check your Stability API key.");
        } else if (response.status === 400) {
          throw new Error(`Bad request: ${errorMessage}. Check image format and prompt.`);
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        } else if (response.status === 413) {
          throw new Error("Image is too large. Try a smaller image (less than 8MB).");
        } else {
          throw new Error(errorMessage);
        }
      }
      
      console.log("Processing successful response from Stability API");
      
      // Parse the response
      const result = await response.json();
      
      if (!result.artifacts || result.artifacts.length === 0) {
        throw new Error("No images returned from Stability API");
      }
      
      console.log(`Received ${result.artifacts.length} generated images`);
      
      // Process and upload images to Supabase storage
      const imageUrls = await processAndSaveResultImages(result.artifacts, projectId);
      return imageUrls;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error("Stability API request timed out. Try with a smaller image or simpler request.");
      }
      throw fetchError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating staged room:", errorMessage);
    
    // Update project status with detailed error message
    await updateProjectStatus(
      projectId, 
      "failed", 
      `Stability AI error: ${errorMessage}`
    );
    
    throw error;
  }
}
