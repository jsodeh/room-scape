
import { updateProjectStatus, updateProjectWithResults } from "./projectManager.ts";
import { fetchImage } from "./imageProcessor.ts";
import { geminiApiKey } from "./supabaseClient.ts";

// Generate staged room using Google's Gemini 2.0 Flash API
export async function generateStagedRoomWithGemini(
  roomImageData: ArrayBuffer, 
  prompt: string, 
  referenceImageUrl: string | undefined, 
  projectId: string
): Promise<string[]> {
  console.log("Using Gemini 2.0 Flash API to generate staged room");
  
  try {
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY is not configured in environment variables");
      throw new Error("GEMINI_API_KEY is not set. Please configure it in the Supabase secrets.");
    }
    
    // Convert room image data to base64
    const roomImageBase64 = btoa(String.fromCharCode(...new Uint8Array(roomImageData)));
    
    // Prepare reference image if provided
    let referenceImageBase64: string | undefined;
    if (referenceImageUrl) {
      try {
        const refImageData = await fetchImage(referenceImageUrl, "reference");
        referenceImageBase64 = btoa(String.fromCharCode(...new Uint8Array(refImageData)));
        console.log("Reference image processed successfully");
      } catch (refError) {
        console.error("Error processing reference image, continuing without it:", refError);
      }
    }
    
    // Prepare the prompt for Gemini
    const enhancedPrompt = `You are a virtual staging expert. ${prompt}
Please transform this empty room image into a beautifully staged space.
Make sure to maintain the room's structure, dimensions, and architectural elements.
The staging should look realistic and not AI-generated.`;
    
    // Prepare the request body
    const requestBody: any = {
      contents: [
        {
          role: "user",
          parts: [
            { text: enhancedPrompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: roomImageBase64
              }
            }
          ]
        }
      ],
      generation_config: {
        temperature: 0.4,
        top_p: 1,
        top_k: 32,
        max_output_tokens: 4096,
        response_mime_type: "image/png"
      }
    };
    
    // Add reference image if provided
    if (referenceImageBase64) {
      requestBody.contents[0].parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: referenceImageBase64
        }
      });
      requestBody.contents[0].parts.push({ text: "Use this second image as a reference for the style and design." });
    }
    
    // Log request details for debugging
    console.log("Sending request to Gemini API");
    console.log("Prompt length:", enhancedPrompt.length);
    
    // Make the API request to Gemini
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error (${response.status}):`, errorText);
      throw new Error(`Gemini API error (status ${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Gemini API response received");
    
    // Extract the image from the response
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || 
        !result.candidates[0].content.parts || !result.candidates[0].content.parts[0] || 
        !result.candidates[0].content.parts[0].inline_data) {
      console.error("Unexpected Gemini response format:", JSON.stringify(result));
      throw new Error("Gemini API did not return an image. Please check your prompt and try again.");
    }
    
    const generatedImageBase64 = result.candidates[0].content.parts[0].inline_data.data;
    
    // Process and save the image
    const imageUrls = await processAndSaveGeminiResult(generatedImageBase64, projectId);
    return imageUrls;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating staged room with Gemini:", errorMessage);
    
    // Update project status with detailed error message
    await updateProjectStatus(
      projectId, 
      "failed", 
      `Gemini API error: ${errorMessage}`
    );
    
    throw error;
  }
}

// Process and save the Gemini-generated image
async function processAndSaveGeminiResult(base64Image: string, projectId: string): Promise<string[]> {
  try {
    // Import the processAndSaveResultImages function
    const { processAndSaveResultImages } = await import("./imageProcessor.ts");
    
    // Convert base64 to artifacts format expected by processAndSaveResultImages
    const artifacts = [{ image: base64Image }];
    
    // Process and save the image
    const imageUrls = await processAndSaveResultImages(artifacts, projectId);
    return imageUrls;
  } catch (error) {
    console.error("Error processing Gemini result:", error);
    throw error;
  }
}
