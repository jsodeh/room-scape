
import { supabase } from "./index.ts";

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

// Update project with results
export async function updateProjectWithResults(projectId: string, stagedImages: string[]) {
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
