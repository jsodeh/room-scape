
export interface StagingContextType {
  // Image Upload State
  uploadedImages: File[];
  originalImagePreviews: string[];
  originalImageUrls: string[];
  
  // Instruction State
  stagingInstructions: string;
  editInstructions: string;
  
  // Reference Image State
  referenceImage: File | null;
  referenceImageUrl: string | null;
  
  // Status State
  isProcessing: boolean;
  isComplete: boolean;
  isEditMode: boolean;
  
  // Result State
  stagedImageResults: string[];
  currentProjectId: string | null;
  
  // Setters
  setUploadedImages: (files: File[]) => void;
  setStagingInstructions: (instructions: string) => void;
  setEditInstructions: (instructions: string) => void;
  setIsEditMode: (isEdit: boolean) => void;
  setReferenceImage: (file: File | null) => void;
  setReferenceImageUrl: (url: string | null) => void;
  setOriginalImagePreviews: (previews: string[]) => void;
  setOriginalImageUrls: (urls: string[]) => void;
  setStagedImageResults: (results: string[]) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsComplete: (isComplete: boolean) => void;
  setCurrentProjectId: (id: string | null) => void;
  
  // Handlers
  handleImagesSelected: (files: File[]) => void;
  handleImageUrlsReady: (urls: string[]) => void;
  handleInstructionsChange: (instructions: string) => void;
  handleEditInstructionsChange: (instructions: string) => void;
  handleReferenceImageChange: (file: File | null) => void;
  handleReferenceImageUpload: (url: string | null) => void;
  handleEdit: (initialInstructions?: string) => void;
  handleEditSubmit: () => void;
  resetState: () => void;
}
