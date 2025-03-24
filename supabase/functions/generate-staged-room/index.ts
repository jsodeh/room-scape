import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomImageUrl, furnitureUrls, instructions, projectId, referenceImageUrl } = await req.json();

    // Validate required inputs
    if (!validateInputs(roomImageUrl, projectId)) {
      throw new Error("Missing required inputs");
    }

    console.log("Processing stage request for project:", projectId);
    console.log("Room image:", roomImageUrl);
    console.log("Furniture items count:", furnitureUrls?.length || 0);
    console.log("Instructions length:", instructions?.length || 0);
    console.log("Reference image:", referenceImageUrl || "None");

    // Update project status to processing
    await updateProjectStatus(projectId, "processing");

    // Fetch the room image as binary data
    const roomImageData = await fetchImage(roomImageUrl, "room");

    // Create prompt based on inputs
    const prompt = createPrompt(instructions, furnitureUrls, referenceImageUrl);
    console.log("Final prompt:", prompt);

    // Process and generate the staged room using Stability AI v2beta API
    const stagedImages = await generateStagedRoomV2(roomImageData, prompt, referenceImageUrl, projectId);

    // Update the project with generated images
    const updatedProject = await updateProjectWithResults(projectId, stagedImages);

    console.log("Project updated successfully with staged images");
    return createSuccessResponse(updatedProject);
  } catch (error) {
    console.error("Error in generate-staged-room function:", error);
    return createErrorResponse(error);
  }
});

// Validation function
function validateInputs(roomImageUrl, projectId) {
  if (!roomImageUrl) {
    console.error("Room image URL is required");
    return false;
  }

  if (!projectId) {
    console.error("Project ID is required");
    return false;
  }

  if (!stabilityApiKey) {
    console.error("STABILITY_API_KEY is not configured");
    return false;
  }

  return true;
}

// Update project status function
async function updateProjectStatus(projectId, status, errorMessage = null) {
  const updateData = { 
    status, 
    updated_at: new Date()
  };
  
  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  try {
    console.log(`Updating project ${projectId} with status: ${status}`);
    await supabase
      .from("staging_projects")
      .update(updateData)
      .eq("id", projectId);
  } catch (updateError) {
    console.error("Failed to update project status:", updateError);
  }
}

// Helper function to fetch images
async function fetchImage(imageUrl, type) {
  console.log(`Fetching ${type} image...`);
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    const errorMsg = `Failed to fetch ${type} image: ${imageResponse.status} ${imageResponse.statusText}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  const imageData = await imageResponse.arrayBuffer();
  console.log(`${type} image fetched successfully, size:`, imageData.byteLength);
  return imageData;
}

// Create prompt based on inputs
function createPrompt(instructions, furnitureUrls, referenceImageUrl) {
  let prompt = "Virtually stage this room";
  
  // If user provided instructions, use them as the primary guide
  if (instructions && instructions.trim().length > 0) {
    prompt += `: ${instructions}`;
  } else {
    // Default instructions if none provided
    prompt += " with modern, stylish furniture. Create an inviting space with appropriate furnishings.";
  }
  
  // Add furniture details if available
  if (furnitureUrls && furnitureUrls.length > 0) {
    if (!instructions || !instructions.includes("furniture")) {
      prompt += ". Include the following furniture items:";
      for (const url of furnitureUrls) {
        // Extract furniture name from URL or use generic description
        const furnitureName = url.split('/').pop()?.split('.')[0]?.replace(/-/g, ' ') || "selected item";
        prompt += ` ${furnitureName},`;
      }
      prompt = prompt.slice(0, -1); // Remove trailing comma
    }
  }

  if (referenceImageUrl) {
    prompt += ". Use the provided reference image as a style guide for the staging.";
  }

  prompt += ". Make sure the final image looks photorealistic and maintains the original room structure.";
  
  return prompt;
}

// Generate staged room using Stability AI v2beta API
async function generateStagedRoomV2(roomImageData, prompt, referenceImageUrl, projectId) {
  console.log("Using Stability AI v2beta API to generate staged room");
  
  try {
    // Convert image data to base64
    const base64Image = arrayBufferToBase64(roomImageData);
    
    // Prepare request body for the v2beta search-and-replace endpoint
    const requestBody = {
      image: base64Image,
      prompt: prompt,
      seed: Math.floor(Math.random() * 2147483647),  // Random seed value
      cfg_scale: 7,
      samples: 1
    };
    
    // Reference image if provided
    if (referenceImageUrl) {
      try {
        const refImageData = await fetchImage(referenceImageUrl, "reference");
        requestBody.reference_image = arrayBufferToBase64(refImageData);
      } catch (refError) {
        console.error("Error processing reference image, continuing without it:", refError);
      }
    }
    
    console.log("Sending request to Stability AI v2beta API");
    console.log("Using endpoint: search-and-replace");
    
    // Make request to Stability AI v2beta API
    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/edit/search-and-replace",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stabilityApiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stability API error response:", response.status);
      console.error("Error details:", errorText);
      throw new Error(`Stability API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Received successful response from Stability API");
    
    if (!result.artifacts || result.artifacts.length === 0) {
      throw new Error("No images returned from Stability API");
    }
    
    // Process and upload images to Supabase storage
    const imageUrls = await processAndSaveResultImages(result.artifacts, projectId);
    return imageUrls;
  } catch (error) {
    console.error("Error generating staged room:", error);
    await updateProjectStatus(projectId, "failed", error.message);
    throw error;
  }
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Process and save generated images from the v2beta API
async function processAndSaveResultImages(artifacts, projectId) {
  const stagedImages = [];
  
  for (let i = 0; i < artifacts.length; i++) {
    const artifact = artifacts[i];
    
    // Decode base64 image
    const imageData = Uint8Array.from(atob(artifact.image), c => c.charCodeAt(0));
    
    // Generate a unique filename
    const timestamp = new Date().getTime();
    const fileName = `staged-${projectId}-${timestamp}-${i}.png`;
    const filePath = `staged-images/${fileName}`;
    
    console.log(`Uploading image to Supabase Storage: ${filePath}`);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("room-images")
      .upload(filePath, imageData, {
        contentType: "image/png",
        upsert: true,
      });
    
    if (error) {
      console.error("Error uploading staged image:", error);
      throw error;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("room-images")
      .getPublicUrl(filePath);
    
    stagedImages.push(publicUrlData.publicUrl);
    console.log(`Image uploaded successfully. Public URL: ${publicUrlData.publicUrl}`);
  }
  
  return stagedImages;
}

// Update project with results
async function updateProjectWithResults(projectId, stagedImages) {
  const { data: updatedProject, error: updateError } = await supabase
    .from("staging_projects")
    .update({
      staged_images: stagedImages,
      status: "completed",
      updated_at: new Date(),
      error_message: null, // Clear any previous error messages
    })
    .eq("id", projectId)
    .select()
    .single();
  
  if (updateError) {
    console.error("Error updating project:", updateError);
    throw updateError;
  }
  
  return updatedProject;
}

// Helper function to update project with error status - used in catch blocks
async function updateProjectWithError(projectId, errorMessage) {
  return updateProjectStatus(projectId, "failed", errorMessage);
}

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
  // Make sure to update project with error if we have a project ID
  // This is done here as a safeguard for any errors that might occur
  try {
    const requestBody = JSON.parse(error.requestBody || "{}");
    if (requestBody.projectId) {
      updateProjectWithError(requestBody.projectId, error.message);
    }
  } catch (e) {
    console.error("Failed to extract project ID from error context:", e);
  }
  
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: error.message 
    }),
    { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
