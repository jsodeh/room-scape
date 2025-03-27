
// Import required modules
import { supabase, geminiApiKey } from "./supabaseClient.ts";
import { arrayBufferToBase64 } from "./utils.ts";
import { updateProjectStatus } from "./projectManager.ts";
import { processAndSaveResultImages } from "./imageProcessor.ts";

// Gemini API configuration
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-1.5-flash-latest"; // Using the latest flash model

// Function to generate a staged room using Gemini 2.0 Flash API
export async function generateStagedRoomWithGemini(
  roomImageData: ArrayBuffer,
  prompt: string,
  referenceImageUrl: string | undefined,
  projectId: string
): Promise<string[]> {
  try {
    console.log("Starting Gemini 2.0 Flash API processing...");
    
    // Verify Gemini API key is available
    if (!geminiApiKey) {
      throw new Error("Gemini API key is not configured");
    }
    
    // Convert room image to base64 for API request
    const base64Image = arrayBufferToBase64(roomImageData);
    
    // Construct a specific prompt for image-to-image generation
    const enhancedPrompt = `
Generate a photorealistic virtual staging of this room based on the following instructions:
${prompt}

IMPORTANT: You MUST output a RAW Base64-encoded PNG image of the staged room with NO explanation text.
Do not include any text or description in your response, ONLY the base64-encoded PNG image.
The generated image must maintain the original room's structure while adding the requested furnishings.
`;
    
    console.log("Prompt length:", enhancedPrompt.length);
    
    // Build Gemini API request for image generation
    const apiUrl = `${GEMINI_API_URL}/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;
    
    // Construct the request body for image-to-image generation
    const requestBody: any = {
      contents: [
        {
          parts: [
            {
              text: enhancedPrompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      generation_config: {
        temperature: 0.2,
        top_p: 0.95,
        top_k: 32,
        max_output_tokens: 4096
      }
    };
    
    // Add reference image if provided
    if (referenceImageUrl) {
      try {
        console.log("Adding reference image to Gemini request");
        const referenceImageResponse = await fetch(referenceImageUrl);
        const referenceImageBuffer = await referenceImageResponse.arrayBuffer();
        const referenceBase64 = arrayBufferToBase64(referenceImageBuffer);
        
        requestBody.contents[0].parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: referenceBase64
          }
        });
        
        // Update prompt to mention reference image
        requestBody.contents[0].parts[0].text += "\nUse the second provided image as a style reference.";
      } catch (refError) {
        console.log("Could not load reference image:", refError);
      }
    }
    
    console.log("Sending request to Gemini API");
    
    // Send request to Gemini API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    // Check for error responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (status ${response.status}): ${errorText}`);
    }
    
    // Parse response
    const data = await response.json();
    console.log("Gemini API response received");
    
    // Handle the response format for image generation
    // Look for base64 image data in the response
    const generatedImages: string[] = [];
    
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          // Check if the part contains image data directly
          if (part.inline_data) {
            console.log("Found inline image data in Gemini response");
            generatedImages.push(part.inline_data.data);
          } 
          // Check if the part contains a text that's a base64 image
          else if (part.text) {
            // Try to extract a base64 image from text
            console.log("Checking for base64 image in text response");
            const base64Match = part.text.match(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);
            if (base64Match) {
              console.log("Found base64 image data in text");
              generatedImages.push(base64Match[0]);
            }
          }
        }
      }
    }
    
    // If no image data found, check if we got a text response containing a URL or base64 data
    if (generatedImages.length === 0 && data.candidates && data.candidates[0].content.parts[0].text) {
      const text = data.candidates[0].content.parts[0].text;
      console.log("Examining text response for image data");
      
      // Check for base64 data in the text
      const base64Pattern = /data:image\/[^;]+;base64,([^"'\s]+)/g;
      let match;
      while ((match = base64Pattern.exec(text)) !== null) {
        console.log("Found base64 image in response text");
        generatedImages.push(match[1]);
      }
      
      // If still no images, check for URLs
      if (generatedImages.length === 0) {
        const urlPattern = /(https?:\/\/[^\s"']+\.(png|jpg|jpeg|gif))/g;
        while ((match = urlPattern.exec(text)) !== null) {
          console.log("Found image URL in response text:", match[1]);
          try {
            // Download the image from the URL
            const imgResponse = await fetch(match[1]);
            const buffer = await imgResponse.arrayBuffer();
            generatedImages.push(arrayBufferToBase64(buffer));
          } catch (e) {
            console.error("Failed to fetch image from URL:", e);
          }
        }
      }
    }
    
    if (generatedImages.length > 0) {
      console.log(`Processing ${generatedImages.length} images from Gemini API`);
      return await processAndSaveResultImages(generatedImages.map(img => ({ image: img })), projectId);
    } else {
      console.error("Unexpected Gemini response format:", JSON.stringify(data));
      throw new Error("Gemini did not return a valid image. Please try updating your prompt to be more specific about generating an image.");
    }
  } catch (error) {
    console.error("Error generating staged room with Gemini:", error);
    await updateProjectStatus(projectId, "failed", `Gemini API error: ${error.message}`);
    throw error;
  }
}
