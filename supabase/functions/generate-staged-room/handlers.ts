import { corsHeaders } from "./cors.ts";
import { updateProjectStatus, updateProjectWithResults } from "./projectManager.ts";
import { fetchImage } from "./imageProcessor.ts";
import { supabase, stabilityApiKey, geminiApiKey } from "./supabaseClient.ts";
import { createPrompt } from "./utils.ts";
import { generateStagedRoom } from "./stabilityApi.ts";
import { HttpError, requireUser, requireOwnedAsset } from "../_shared/security.ts";

export function createSuccessResponse(project: unknown) {
  return Response.json({ success: true, project }, { headers: corsHeaders });
}

export function createErrorResponse(error: unknown) {
  if (!(error instanceof HttpError)) console.error("Generation failed:", error);
  return Response.json({ success: false, error: error instanceof HttpError ? error.message : "The design could not be generated. Please try again." }, {
    status: error instanceof HttpError ? error.status : 500, headers: corsHeaders,
  });
}

export async function handleStagingRequest(req: Request) {
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Use POST for generation.');
    const user = await requireUser(req);
    let body;
    try { body = await req.json(); } catch { throw new HttpError(400, 'Invalid request format.'); }
    const { roomImageUrl, instructions, projectId } = body || {};
    if (typeof projectId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId))
      throw new HttpError(400, 'Invalid project ID.');
    if (typeof instructions !== 'string' || instructions.length > 10000)
      throw new HttpError(400, 'Provide a design brief of at most 10,000 characters.');
    requireOwnedAsset(roomImageUrl, user.id);
    const { data: project, error: projectError } = await supabase.from('staging_projects')
      .select('id, user_id, original_images, staged_images, workflow_version').eq('id', projectId).eq('user_id', user.id).maybeSingle();
    if (projectError) throw projectError;
    if (!project) throw new HttpError(404, 'Project not found.');
    if (project.workflow_version === 2) throw new HttpError(409, 'Open this saved room in the design workspace to continue its version history.');
    if (![...(project.original_images || []), ...(project.staged_images || [])].includes(roomImageUrl))
      throw new HttpError(403, "Use an original or saved design from this project.");
    if (!geminiApiKey && !stabilityApiKey) throw new HttpError(503, 'Image generation is not configured yet.');
    const { data: claimed, error: claimError } = await supabase.from('staging_projects')
      .update({ status: 'processing', error_message: null }).eq('id', projectId).eq('user_id', user.id)
      .neq('status', 'processing').select('id').maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) throw new HttpError(409, 'This project is already being generated.');
    try {
      const image = await fetchImage(roomImageUrl, 'room');
      const images = await generateStagedRoom(image, createPrompt(instructions, null), null, projectId);
      return createSuccessResponse(await updateProjectWithResults(projectId, images));
    } catch (error) {
      await updateProjectStatus(projectId, 'failed', 'Generation could not be completed.');
      throw error;
    }
  } catch (error) { return createErrorResponse(error); }
}
