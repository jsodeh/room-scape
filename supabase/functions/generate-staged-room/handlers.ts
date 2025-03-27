
import { corsHeaders } from "./cors.ts";
import { validateInputs, createPrompt } from "./utils.ts";
import { updateProjectStatus, updateProjectWithResults } from "./projectManager.ts";
import { fetchImage } from "./imageProcessor.ts";
import { supabase, supabaseUrl, supabaseServiceKey, stabilityApiKey, geminiApiKey } from "./supabaseClient.ts";
import { generateStagedRoom } from "./stabilityApi.ts";

// Create a success response
export function createSuccessResponse(updatedProject: any) {
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
export function createErrorResponse(error: any) {
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

// Main handler for processing staging requests
export async function handleStagingRequest(req: Request) {
  try {
    console.log("Edge function started at:", new Date().toISOString());
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request received with parameters:", JSON.stringify({
        projectId: requestBody.projectId,
        roomImageUrl: requestBody.roomImageUrl ? "Provided" : "Missing",
        instructionsLength: requestBody.instructions?.length || 0,
        referenceImageUrl: requestBody.referenceImageUrl ? "Provided" : "Not Provided"
      }));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      throw new Error("Invalid request format: " + parseError.message);
    }
    
    const { roomImageUrl, instructions, projectId, referenceImageUrl } = requestBody;

    // Validate required inputs
    if (!validateInputs(roomImageUrl, projectId, geminiApiKey || stabilityApiKey)) {
      throw new Error("Missing required inputs: roomImageUrl, projectId, or API keys (GEMINI_API_KEY or STABILITY_API_KEY)");
    }

    console.log("Processing stage request for project:", projectId);
    
    // Update project status to processing
    console.log("Updating project status to processing...");
    await updateProjectStatus(projectId, "processing");

    try {
      // Fetch the room image as binary data - THIS IS THE PRIMARY IMAGE TO BE TRANSFORMED
      console.log("Fetching room image from URL:", roomImageUrl);
      const roomImageData = await fetchImage(roomImageUrl, "room");
      console.log("Room image fetched successfully, size:", roomImageData.byteLength);

      // Create prompt based on inputs
      let prompt = createPrompt(instructions, null); // Don't pass referenceImageUrl here
      console.log("Created prompt:", prompt);

      // Process and generate the staged room
      // Make sure that roomImageData is passed as the primary image
      console.log("Starting image generation processing...");
      const stagedImages = await generateStagedRoom(roomImageData, prompt, null, projectId);
      console.log("Image generation complete, received images:", stagedImages.length);

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
}
