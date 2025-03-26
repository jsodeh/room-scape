
export class StabilityApiClient {
  private apiKey: string;
  private baseUrl = "https://api.stability.ai";
  private endpoint = "/v2beta/stable-image/edit/search-and-replace";
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateImage(formData: FormData): Promise<any> {
    console.log("Sending request to Stability API now...");
    
    // Add timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Request timeout reached, aborting");
      controller.abort();
    }, 30000); // 30 second timeout for large images
    
    try {
      // Make request to Stability AI v2beta API with correct Accept header
      const response = await fetch(
        `${this.baseUrl}${this.endpoint}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            // Make sure Accept header is set correctly for this endpoint
            "Accept": "application/json"
          },
          body: formData,
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      console.log(`Stability API response status: ${response.status}`);
      
      // Handle error responses
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
      
      return result;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError.name, fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        throw new Error("Stability API request timed out. The image may be too large or complex. Please use a smaller image (less than 4MB) or simplify your request.");
      }
      throw fetchError;
    }
  }
}
