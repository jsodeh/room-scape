
import { supabase } from "./supabaseClient.ts";

// Update project status function
export async function updateProjectStatus(
  projectId: string, 
  status: "processing" | "completed" | "failed", 
  errorMessage: string | null = null
) {
  const updateData: Record<string, any> = { 
    status, 
    updated_at: new Date()
  };
  
  if (errorMessage) {
    updateData.error_message = errorMessage;
    console.log(`Project ${projectId} failed with error: ${errorMessage}`);
  }

  try {
    console.log(`Updating project ${projectId} with status: ${status}`);
    const { data, error } = await supabase
      .from("staging_projects")
      .update(updateData)
      .eq("id", projectId)
      .select();
      
    if (error) {
      console.error("Failed to update project status:", error);
    } else {
      console.log(`Project status updated successfully to ${status}`);
    }
  } catch (updateError) {
    console.error("Exception updating project status:", updateError);
  }
}

// Update project with results
export async function updateProjectWithResults(projectId: string, stagedImages: string[]) {
  console.log(`Updating project ${projectId} with ${stagedImages.length} images`);
  
  try {
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
      console.error("Error updating project with results:", updateError);
      throw updateError;
    }
    
    console.log("Project updated successfully with generated images");
    return updatedProject;
  } catch (error) {
    console.error("Exception updating project with results:", error);
    throw error;
  }
}
