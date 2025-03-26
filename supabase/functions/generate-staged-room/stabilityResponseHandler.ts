
// Process and validate the Stability API response
export function handleStabilityResponse(result: any): { image: string }[] {
  console.log("Processing Stability API response");
  
  // Log the response structure for debugging
  console.log("Response structure:", Object.keys(result));
  
  // Expected result structure from Stability API docs
  let artifacts: { image: string }[] = [];
  
  // Log the full response for debugging
  console.log("Full Stability API response:", JSON.stringify(result, null, 2));
  
  // Try to extract images using various possible response formats
  if (result.artifacts && Array.isArray(result.artifacts)) {
    console.log("Found artifacts array with length:", result.artifacts.length);
    artifacts = result.artifacts;
  } else if (result.images && Array.isArray(result.images)) {
    console.log("Found images array with length:", result.images.length);
    artifacts = result.images.map((img: string | { image: string }) => (
      { image: typeof img === 'string' ? img : img.image }
    ));
  } else if (result.generations && Array.isArray(result.generations)) {
    console.log("Found generations array with length:", result.generations.length);
    artifacts = result.generations.map((gen: any) => ({ image: gen.image || gen.url || gen }));
  } else if (result.result && Array.isArray(result.result)) {
    console.log("Found result array with length:", result.result.length);
    artifacts = result.result.map((img: string) => ({ image: img }));
  } else if (result.output && Array.isArray(result.output)) {
    console.log("Found output array with length:", result.output.length);
    artifacts = result.output.map((img: string) => ({ image: img }));
  } else if (result.data && result.data.images && Array.isArray(result.data.images)) {
    console.log("Found nested data.images array with length:", result.data.images.length);
    artifacts = result.data.images.map((img: string | { image: string }) => (
      { image: typeof img === 'string' ? img : img.image }
    ));
  }
  
  // Final check if we got any images
  if (artifacts.length === 0) {
    console.error("No images could be extracted from the Stability API response", result);
    throw new Error("No images found in Stability API response. Please check your API key and request parameters.");
  }
  
  // Validate that the artifacts have the expected structure
  artifacts.forEach((artifact, index) => {
    if (!artifact.image) {
      console.error(`Invalid artifact at index ${index}:`, artifact);
      throw new Error(`Invalid image data in Stability API response at index ${index}.`);
    }
  });
  
  console.log(`Successfully extracted ${artifacts.length} images from the response`);
  return artifacts;
}
