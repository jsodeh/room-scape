
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
    console.log("Edge function started at:", new Date().toISOString());
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request received with parameters:", JSON.stringify({
        projectId: requestBody.projectId,
        roomImageUrl: requestBody.roomImageUrl ? "Provided" : "Missing",
        furnitureUrls: requestBody.furnitureUrls?.length || 0,
        instructionsLength: requestBody.instructions?.length || 0,
        referenceImageUrl: requestBody.referenceImageUrl ? "Provided" : "Not Provided"
      }));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      throw new Error("Invalid request format: " + parseError.message);
    }
    
    const { roomImageUrl, furnitureUrls, instructions, projectId, referenceImageUrl } = requestBody;

    // Validate required inputs
    if (!validateInputs(roomImageUrl, projectId, stabilityApiKey)) {
      throw new Error("Missing required inputs: roomImageUrl, projectId, or STABILITY_API_KEY");
    }

    console.log("Processing stage request for project:", projectId);
    
    // Update project status to processing
    console.log("Updating project status to processing...");
    await updateProjectStatus(projectId, "processing");

    try {
      // Fetch the room image as binary data
      console.log("Fetching room image from URL:", roomImageUrl);
      const roomImageData = await fetchImage(roomImageUrl, "room");
      console.log("Room image fetched successfully");

      // Create prompt based on inputs
      let prompt = createPrompt(instructions, furnitureUrls, referenceImageUrl);
      console.log("Created prompt:", prompt);

      // Process and generate the staged room using Stability AI v2beta API
      console.log("Starting Stability AI API processing...");
      const stagedImages = await generateStagedRoomV2(roomImageData, prompt, referenceImageUrl, projectId);
      console.log("Stability AI processing complete, received images:", stagedImages.length);

      // Update the project with generated images
      console.log("Updating project with results...");
      const updatedProject = await updateProjectWithResults(projectId, stagedImages);

      console.log("Project updated successfully, sending success response");
      return createSuccessResponse(updatedProject);
    } catch (processingError) {
      // Handle processing errors
      console.error("Error processing image:", processingError);
      const errorMessage = processingError instanceof Error ? processingError.message : String(processingError);
      
      // Update project with detailed error
      console.log("Updating project with failure status and error message");
      await updateProjectStatus(projectId, "failed", errorMessage);
      
      return createErrorResponse({
        message: errorMessage,
        name: "ProcessingError",
        stack: processingError instanceof Error ? processingError.stack : undefined,
        requestBody: requestBody
      });
    }
  } catch (error) {
    console.error("Fatal error in generate-staged-room function:", error);
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
      console.log("Updating project status to failed for project:", parsedBody.projectId);
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
