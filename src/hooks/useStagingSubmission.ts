import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  createStagingProject,
  generateStagedImages,
} from "@/services/stagingService";
interface UseStagingSubmissionProps {
  userId?: string;
  originalImageUrls: string[];
  stagingInstructions: string;
  referenceImageUrl: string | null;
  setCurrentProjectId: (id: string | null) => void;
  setIsProcessing: (processing: boolean) => void;
  setIsComplete: (complete: boolean) => void;
  setStagedImageResults: (images: string[]) => void;
  reportError: (
    key: "submission" | "processing" | "general",
    message: string,
    details?: unknown,
  ) => void;
  clearError: () => void;
}
export function useStagingSubmission(props: UseStagingSubmissionProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const locked = useRef(false);
  const handleSubmit = async (uploadedUrls?: string[]) => {
    if (locked.current) return;
    props.clearError();
    const urls = uploadedUrls || props.originalImageUrls;
    if (!props.userId) {
      props.reportError("general", "Sign in to save and generate your room.");
      return;
    }
    if (urls.length !== 1) {
      props.reportError("general", "Choose one room photo for this design.");
      return;
    }
    locked.current = true;
    setIsSubmitting(true);
    props.setCurrentProjectId(null);
    props.setIsComplete(false);
    props.setIsProcessing(true);
    try {
      const instructions =
        props.stagingInstructions.trim() ||
        "Stage this room with warm, inviting modern furniture. Preserve its architecture.";
      const project = await createStagingProject(
        props.userId,
        instructions,
        [],
        urls,
        props.referenceImageUrl || undefined,
      );
      if (!project) throw new Error("Project could not be created");
      props.setCurrentProjectId(project.id);
      void queryClient.invalidateQueries({
        queryKey: ["staging-projects", props.userId],
      });
      const result = await generateStagedImages(
        project.id,
        urls[0],
        instructions,
        props.referenceImageUrl || undefined,
      );
      if (!result || result.status === "failed")
        throw new Error("Generation failed");
      if (result.status === "completed" && result.staged_images?.length) {
        props.setStagedImageResults(result.staged_images);
        props.setIsComplete(true);
        props.setIsProcessing(false);
      }
    } catch (error) {
      props.setIsProcessing(false);
      props.reportError(
        "submission",
        "We could not create this design. Your photo and preferences are still here. Please try again.",
        error,
      );
    } finally {
      locked.current = false;
      setIsSubmitting(false);
    }
  };
  return { handleSubmit, isSubmitting };
}
