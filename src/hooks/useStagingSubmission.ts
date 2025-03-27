
import { useState } from 'react';
import { toast } from 'sonner';
import { createStagingProject, generateStagedImages } from '@/services/stagingService';

interface UseStagingSubmissionProps {
  userId?: string;
  originalImageUrls: string[];
  stagingInstructions: string;
  referenceImageUrl: string | null;
  setCurrentProjectId: (id: string | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  reportError: (key: string, message: string, details?: unknown) => void;
  clearError: (key?: string) => void;
}

export function useStagingSubmission({
  userId,
  originalImageUrls,
  stagingInstructions,
  referenceImageUrl,
  setCurrentProjectId,
  setIsProcessing,
  reportError,
  clearError
}: UseStagingSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createFinalInstructions = () => {
    let finalInstructions = stagingInstructions.trim();
    if (finalInstructions.length === 0) {
      finalInstructions = 'Stage this room to look modern, stylish, and inviting with appropriate furniture.';
    }
    return finalInstructions;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Clear any previous errors
    clearError();
    
    if (!userId) {
      return reportError('auth', 'Please sign in to create staging projects');
    }
    
    if (originalImageUrls.length === 0) {
      return reportError('images', 'Please upload at least one image to stage');
    }
    
    setIsSubmitting(true);
    setIsProcessing(true);
    
    try {
      // Prepare the final instructions
      const finalInstructions = createFinalInstructions();
      
      // Create a new staging project
      const project = await createStagingProject(
        userId, 
        finalInstructions,
        [], // Empty array for furniture IDs
        originalImageUrls,
        referenceImageUrl || undefined
      );
      
      if (!project) {
        throw new Error('Failed to create staging project');
      }
      
      // Save the project ID for polling
      setCurrentProjectId(project.id);
      
      // Use the first image for staging (for now we only support one image)
      const roomImageUrl = originalImageUrls[0];
      
      // Generate staged images - not passing the reference image URL
      await generateStagedImages(
        project.id,
        roomImageUrl,
        finalInstructions
      );
      
      toast.success('Your staging request is being processed. This may take a few minutes.');
    } catch (error) {
      console.error('Error submitting staging request:', error);
      setIsProcessing(false);
      return reportError('submission', 'Failed to submit staging request. Please try again.', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting };
}
