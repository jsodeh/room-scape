
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stabilityApiKey = Deno.env.get("STABILITY_API_KEY") || "";

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

    if (!roomImageUrl) {
      throw new Error("Room image URL is required");
    }

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    console.log("Processing stage request for project:", projectId);
    console.log("Room image:", roomImageUrl);
    console.log("Furniture items:", furnitureUrls?.length || 0);
    console.log("Instructions:", instructions || "None provided");
    console.log("Reference image:", referenceImageUrl || "None");

    // Update project status to processing
    await supabase
      .from("staging_projects")
      .update({ status: "processing" })
      .eq("id", projectId);

    // Fetch the room image as binary data
    const roomImageResponse = await fetch(roomImageUrl);
    const roomImageData = await roomImageResponse.arrayBuffer();

    // Create a detailed prompt based on instructions and furniture
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

    console.log("Final prompt:", prompt);

    // Prepare API request based on whether we have a reference image
    const formData = new FormData();
    formData.append("init_image", new Blob([roomImageData], { type: "image/jpeg" }));
    formData.append("text_prompts[0][text]", prompt);
    formData.append("text_prompts[0][weight]", "1");
    formData.append("cfg_scale", "7");
    formData.append("clip_guidance_preset", "FAST_BLUE");
    formData.append("samples", "1");
    formData.append("steps", "30");

    // If we have a reference image, add it as a style reference
    if (referenceImageUrl) {
      try {
        const refImageResponse = await fetch(referenceImageUrl);
        const refImageData = await refImageResponse.arrayBuffer();
        
        // Add the reference image to the request
        formData.append("style_preset", "photographic");
        formData.append("style_reference_image", new Blob([refImageData], { type: "image/jpeg" }));
      } catch (refError) {
        console.error("Error processing reference image, continuing without it:", refError);
      }
    }

    const stabilityResponse = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stabilityApiKey}`,
          Accept: "application/json",
        },
        body: formData,
      }
    );

    if (!stabilityResponse.ok) {
      const errorText = await stabilityResponse.text();
      console.error("Stability API error:", errorText);
      throw new Error(`Stability API error: ${stabilityResponse.status} ${errorText}`);
    }

    const stabilityResult = await stabilityResponse.json();
    console.log("Stability API response received");

    // Process and save the generated images
    const stagedImages = [];
    
    for (const image of stabilityResult.artifacts) {
      // Convert base64 to Buffer
      const imageData = Uint8Array.from(atob(image.base64), c => c.charCodeAt(0));
      
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const fileName = `staged-${projectId}-${timestamp}.png`;
      const filePath = `staged-images/${fileName}`;
      
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
    }

    // Update the project with generated images
    const { data: updatedProject, error: updateError } = await supabase
      .from("staging_projects")
      .update({
        staged_images: stagedImages,
        status: "completed",
        updated_at: new Date(),
      })
      .eq("id", projectId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating project:", updateError);
      throw updateError;
    }

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
  } catch (error) {
    console.error("Error in generate-staged-room function:", error);
    
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
});
