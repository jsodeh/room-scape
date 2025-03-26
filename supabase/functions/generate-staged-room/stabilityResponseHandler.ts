
// Process and validate the Stability API response
export function handleStabilityResponse(result: any): { image: string }[] {
  console.log("Full Stability API response:", JSON.stringify(result, null, 2));
  
  // According to the documentation, the response should contain the images directly in the result
  let artifacts: { image: string }[] = [];
  
  // Expected result structure from Stability API docs - check all possible response formats
  if (result.result && Array.isArray(result.result)) {
    artifacts = result.result.map((img: string) => ({ image: img }));
    console.log(`Found ${artifacts.length} images in 'result' array`);
  } else if (result.images && Array.isArray(result.images)) {
    artifacts = result.images.map((img: string | { image: string }) => (
      { image: typeof img === 'string' ? img : img.image }
    ));
    console.log(`Found ${artifacts.length} images in 'images' array`);
  } else if (result.artifacts && Array.isArray(result.artifacts)) {
    artifacts = result.artifacts;
    console.log(`Found ${artifacts.length} images in 'artifacts' array`);
  } else if (result.output && Array.isArray(result.output)) {
    artifacts = result.output.map((img: string) => ({ image: img }));
    console.log(`Found ${artifacts.length} images in 'output' array`);
  } else {
    // Dump the entire response structure for debugging
    console.error("Unexpected response structure from Stability API, no images found");
    console.error("Response structure:", JSON.stringify(result, null, 2));
    throw new Error(`No images found in Stability API response. Please check your API key and request parameters.`);
  }
  
  return artifacts;
}
