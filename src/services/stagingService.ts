import { supabase } from "@/integrations/supabase/client";
import { StagingProject } from "@/types/database";
const validateProjectStatus = (status: string): StagingProject["status"] =>
  ["pending", "processing", "completed", "failed"].includes(status)
    ? (status as StagingProject["status"])
    : "pending";
export async function createStagingProject(
  userId: string,
  instructions: string,
  furnitureIds: string[],
  originalImageUrls: string[],
  referenceImageUrl?: string,
): Promise<StagingProject> {
  const { data, error } = await supabase
    .from("staging_projects")
    .insert({
      user_id: userId,
      instructions,
      furniture_ids: furnitureIds,
      original_images: originalImageUrls,
      reference_image: referenceImageUrl,
      staged_images: [],
      status: "pending",
      error_message: null,
    })
    .select()
    .single();
  if (error) throw error;
  return { ...data, status: validateProjectStatus(data.status) };
}
export async function generateStagedImages(
  projectId: string,
  roomImageUrl: string,
  instructions: string,
  referenceImageUrl?: string,
): Promise<StagingProject> {
  // The current backend derives styling from analysed reference instructions.
  if (referenceImageUrl) {
    const { error } = await supabase
      .from("staging_projects")
      .update({ reference_image: referenceImageUrl })
      .eq("id", projectId);
    if (error) throw error;
  }
  const { data, error } = await supabase.functions.invoke(
    "generate-staged-room",
    { body: { projectId, roomImageUrl, instructions } },
  );
  if (error) throw error;
  if (!data?.project || data.success === false)
    throw new Error("The design service did not return a project.");
  return {
    ...data.project,
    status: validateProjectStatus(data.project.status),
  };
}
export async function getStagingProject(
  projectId: string,
): Promise<StagingProject | null> {
  const { data, error } = await supabase
    .from("staging_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data ? { ...data, status: validateProjectStatus(data.status) } : null;
}
export async function getUserStagingProjects(
  userId: string,
): Promise<StagingProject[]> {
  const { data, error } = await supabase
    .from("staging_projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((project) => ({
    ...project,
    status: validateProjectStatus(project.status),
  }));
}
