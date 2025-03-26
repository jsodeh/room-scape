
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "./cors.ts";
import { validateInputs, createPrompt } from "./utils.ts";
import { updateProjectStatus, updateProjectWithResults } from "./projectManager.ts";
import { generateStagedRoomV2 } from "./stabilityApi.ts";
import { fetchImage } from "./imageProcessor.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stabilityApiKey = Deno.env.get("STABILITY_API_KEY") || "";

// Log configuration status (without revealing keys)
console.log("Supabase URL configured:", !!supabaseUrl);
console.log("Supabase Service Key configured:", !!supabaseServiceKey);
console.log("Stability API Key configured:", !!stabilityApiKey);

if (!stabilityApiKey) {
  console.error("STABILITY_API_KEY is not configured. Please add it to your Supabase secrets.");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request received with body:", JSON.stringify(requestBody));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      throw new Error("Invalid request format: " + parseError.message);
    }
    
    const { roomImageUrl, furnitureUrls, instructions, projectId, referenceImageUrl } = requestBody;

    // Validate required inputs
    if (!validateInputs(roomImageUrl, projectId, stabilityApiKey)) {
      throw new Error("Missing required inputs");
    }

    console.log("Processing stage request for project:", projectId);
    console.log("Room image:", roomImageUrl);
    console.log("Furniture items count:", furnitureUrls?.length || 0);
    console.log("Instructions length:", instructions?.length || 0);
    console.log("Reference image:", referenceImageUrl || "None");

    // Update project status to processing
    await updateProjectStatus(projectId, "processing");

    // Use a promise with timeout to prevent edge function from timing out without updating project status
    try {
      // Fetch the room image as binary data
      console.log("Fetching room image...");
      const roomImageData = await fetchImage(roomImageUrl, "room");
      console.log("Room image fetched successfully, size:", roomImageData.byteLength, "bytes");

      // Create prompt based on inputs
      let prompt = createPrompt(instructions, furnitureUrls, referenceImageUrl);
      console.log("Final prompt:", prompt);

      // Process and generate the staged room using Stability AI v2beta API
      console.log("Calling Stability AI API...");
      const stagedImages = await generateStagedRoomV2(roomImageData, prompt, referenceImageUrl, projectId);

      // Update the project with generated images
      console.log("Processing complete, updating project with results...");
      const updatedProject = await updateProjectWithResults(projectId, stagedImages);

      console.log("Project updated successfully with staged images");
      return createSuccessResponse(updatedProject);
    } catch (processingError) {
      // Handle processing errors
      console.error("Error processing image:", processingError);
      const errorMessage = processingError instanceof Error ? processingError.message : String(processingError);
      
      // Update project with detailed error
      await updateProjectStatus(projectId, "failed", errorMessage);
      
      return createErrorResponse({
        message: errorMessage,
        name: "ProcessingError",
        stack: processingError instanceof Error ? processingError.stack : undefined,
        requestBody: requestBody
      });
    }
  } catch (error) {
    console.error("Error in generate-staged-room function:", error);
    return createErrorResponse(error);
  }
});

// Create a success response
function createSuccessResponse(updatedProject) {
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "Staged room images generated successfully",
      project: updatedProject
    }),
    { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// Create an error response
function createErrorResponse(error) {
  const errorMessage = error.message || "Unknown error occurred";
  const errorStack = error.stack || "";
  
  // Log detailed error information
  console.error("Error details:", errorMessage);
  console.error("Stack trace:", errorStack);
  
  // Make sure to update project with error if we have a project ID
  try {
    const requestBody = error.requestBody || "{}";
    const parsedBody = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
    if (parsedBody && parsedBody.projectId) {
      updateProjectStatus(parsedBody.projectId, "failed", errorMessage);
    }
  } catch (e) {
    console.error("Failed to extract project ID from error context:", e);
  }
  
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }),
    { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
