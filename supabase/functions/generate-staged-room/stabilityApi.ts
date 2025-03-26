
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
    const imageSizeMB = roomImageData.byteLength / (1024 * 1024);
    console.log(`Room image size: ${imageSizeMB.toFixed(2)}MB`);
    
    // Strict size limit check
    if (imageSizeMB > 4) {
      const sizeError = `Image size (${imageSizeMB.toFixed(2)}MB) exceeds the 4MB limit for Stability AI.`;
      console.error(sizeError);
      throw new Error(sizeError);
    }
    
    // Create FormData for multipart/form-data request
    console.log("Creating FormData with image and parameters");
    const formData = new FormData();
    
    // Create a Blob from the room image data
    const roomImageBlob = new Blob([new Uint8Array(roomImageData)], { type: 'image/jpeg' });
    formData.append('image', roomImageBlob, 'room_image.jpg');
    
    // IMPORTANT: API requires "search_prompt" parameter
    formData.append('search_prompt', prompt);  // Add the search_prompt parameter
    formData.append('prompt', prompt);         // Keep the original prompt parameter too for backward compatibility
    
    formData.append('seed', Math.floor(Math.random() * 2147483647).toString());
    formData.append('cfg_scale', '7');
    formData.append('samples', '1');
    
    // Reference image if provided
    if (referenceImageUrl) {
      try {
        const refImageData = await fetchImage(referenceImageUrl, "reference");
        
        // Check reference image size too
        const refSizeMB = refImageData.byteLength / (1024 * 1024);
        console.log(`Reference image size: ${refSizeMB.toFixed(2)}MB`);
        
        if (refSizeMB > 4) {
          console.warn(`Reference image is too large (${refSizeMB.toFixed(2)}MB). Skipping it.`);
        } else {
          const refImageBlob = new Blob([new Uint8Array(refImageData)], { type: 'image/jpeg' });
          formData.append('reference_image', refImageBlob, 'reference_image.jpg');
          console.log("Added reference image to the request");
        }
      } catch (refError) {
        console.error("Error processing reference image, continuing without it:", refError);
      }
    }
    
    // Log details about the request for better debugging
    console.log("Preparing request to Stability AI v2beta API");
    console.log("Using endpoint: search-and-replace");
    console.log("Prompt being sent:", prompt);
    console.log("API Key valid:", stabilityApiKey.length > 0 ? "Yes" : "No");
    
    // Add timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Request timeout reached, aborting");
      controller.abort();
    }, 30000); // 30 second timeout for large images
    
    try {
      console.log("Sending request to Stability API now...");
      // Make request to Stability AI v2beta API with correct Accept header
      const response = await fetch(
        "https://api.stability.ai/v2beta/stable-image/edit/search-and-replace",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${stabilityApiKey}`,
            // Make sure Accept header is set correctly for this endpoint
            "Accept": "application/json"
          },
          body: formData,
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      console.log(`Stability API response status: ${response.status}`);
      
      // Detailed error logging for better debugging
      if (!response.ok) {
        const responseText = await response.text();
        console.error(`Stability API error response (${response.status}):`, responseText);
        
        let errorMessage = `Stability API error (status ${response.status})`;
        let errorDetails = "";
        
        try {
          // Try to parse as JSON for more specific error message
          const errorJson = JSON.parse(responseText);
          if (errorJson.message) {
            errorDetails = errorJson.message;
          } else if (errorJson.errors && errorJson.errors.length > 0) {
            errorDetails = errorJson.errors.join(', ');
          } else {
            errorDetails = responseText.substring(0, 200);
          }
        } catch (e) {
          // If not valid JSON, use text
          errorDetails = responseText.substring(0, 200);
        }
        
        errorMessage += `: ${errorDetails}`;
        console.error(errorMessage);
        
        // Handle common error codes with specific messages
        if (response.status === 401) {
          throw new Error("Authentication failed: Invalid Stability API key. Please check your API key in Supabase secrets.");
        } else if (response.status === 400) {
          throw new Error(`Bad request: ${errorDetails}. Check image format and prompt.`);
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        } else if (response.status === 413 || errorDetails.includes("too large")) {
          throw new Error("Image is too large. Please use an image smaller than 4MB.");
        } else if (response.status === 415 || errorDetails.includes("Unsupported Media Type")) {
          throw new Error("Unsupported image format. Please use JPEG or PNG images.");
        } else {
          throw new Error(errorMessage);
        }
      }
      
      console.log("Processing successful response from Stability API");
      
      // Parse the response
      const result = await response.json();
      console.log("Stability API response structure:", Object.keys(result));
      
      if (!result.artifacts || result.artifacts.length === 0) {
        throw new Error("No images returned from Stability API");
      }
      
      console.log(`Received ${result.artifacts.length} generated images`);
      
      // Process and upload images to Supabase storage
      const imageUrls = await processAndSaveResultImages(result.artifacts, projectId);
      return imageUrls;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError.name, fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        throw new Error("Stability API request timed out. The image may be too large or complex. Please use a smaller image (less than 4MB) or simplify your request.");
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
