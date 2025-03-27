
import { toast } from 'sonner';
import { generateStagedImages } from '@/services/stagingService';

// Helper to create final instructions
export const createFinalInstructions = (instructions: string): string => {
  let finalInstructions = instructions.trim();
  if (finalInstructions.length === 0) {
    finalInstructions = 'Stage this room to look modern, stylish, and inviting with appropriate furniture.';
  }
  return finalInstructions;
};

// Handler for image selection
export const createImagesSelectedHandler = (
  setUploadedImages: (files: File[]) => void,
  setOriginalImagePreviews: (previews: string[]) => void
) => {
  return (files: File[]) => {
    setUploadedImages(files);
    
    const imagePreviews = files.map(file => URL.createObjectURL(file));
    setOriginalImagePreviews(imagePreviews);
  };
};

// Handler for edit submission
export const createEditSubmitHandler = (
  currentProjectId: string | null,
  stagedImageResults: string[],
  editInstructions: string,
  setIsProcessing: (processing: boolean) => void,
  setIsComplete: (complete: boolean) => void,
  setIsEditMode: (editMode: boolean) => void
) => {
  return async () => {
    if (!currentProjectId || !stagedImageResults.length) {
      toast.error('Cannot edit without an active project and staged image');
      return;
    }
    
    if (!editInstructions.trim()) {
      toast.error('Please add editing instructions');
      return;
    }
    
    setIsProcessing(true);
    setIsComplete(false);
    
    try {
      // Here we use the currently staged image URL instead of original image
      const stagedImageUrl = stagedImageResults[0];
      
      console.log('Editing staged image with instructions:', editInstructions);
      await generateStagedImages(
        currentProjectId,
        stagedImageUrl, // Use staged image as source instead of original
        editInstructions
      );
      
      setIsEditMode(false);
      toast.info('Applying edits to staged room. This may take a few minutes.');
    } catch (error) {
      console.error('Error editing staged room:', error);
      setIsProcessing(false);
      toast.error('An error occurred while editing. Please try again.');
    }
  };
};

// Handler for edit mode initialization
export const createEditHandler = (
  setEditInstructions: (instructions: string) => void,
  setIsEditMode: (isEdit: boolean) => void
) => {
  return (initialInstructions?: string) => {
    if (initialInstructions) {
      setEditInstructions(initialInstructions);
    } else {
      setEditInstructions('');
    }
    setIsEditMode(true);
  };
};

// Handler for state reset
export const createResetStateHandler = (
  originalImagePreviews: string[],
  setUploadedImages: (files: File[]) => void,
  setStagingInstructions: (instructions: string) => void,
  setEditInstructions: (instructions: string) => void,
  setIsEditMode: (isEdit: boolean) => void,
  setReferenceImage: (file: File | null) => void,
  setReferenceImageUrl: (url: string | null) => void,
  setIsProcessing: (isProcessing: boolean) => void,
  setIsComplete: (isComplete: boolean) => void,
  setOriginalImagePreviews: (previews: string[]) => void,
  setOriginalImageUrls: (urls: string[]) => void,
  setStagedImageResults: (results: string[]) => void,
  setCurrentProjectId: (id: string | null) => void,
  pollingInterval: number | null,
  setPollingInterval: (interval: number | null) => void
) => {
  return () => {
    originalImagePreviews.forEach(url => URL.revokeObjectURL(url));
    
    setUploadedImages([]);
    setStagingInstructions('');
    setEditInstructions('');
    setIsEditMode(false);
    setReferenceImage(null);
    setReferenceImageUrl(null);
    setIsProcessing(false);
    setIsComplete(false);
    setOriginalImagePreviews([]);
    setOriginalImageUrls([]);
    setStagedImageResults([]);
    setCurrentProjectId(null);
    
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };
};
