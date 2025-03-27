
// Initial state for the staging context
export const initialStagingState = {
  // Image Upload State
  uploadedImages: [] as File[],
  originalImagePreviews: [] as string[],
  originalImageUrls: [] as string[],
  
  // Instruction State
  stagingInstructions: '',
  editInstructions: '',
  
  // Reference Image State
  referenceImage: null as File | null,
  referenceImageUrl: null as string | null,
  
  // Status State
  isProcessing: false,
  isComplete: false,
  isEditMode: false,
  
  // Result State
  stagedImageResults: [] as string[],
  currentProjectId: null as string | null,
  
  // Polling
  pollingInterval: null as number | null
};

export type StagingStateType = typeof initialStagingState;
