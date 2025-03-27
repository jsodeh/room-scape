
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { generateStagedImages } from '@/services/stagingService';

interface StagingContextType {
  uploadedImages: File[];
  stagingInstructions: string;
  referenceImage: File | null;
  referenceImageUrl: string | null;
  isProcessing: boolean;
  isComplete: boolean;
  isEditing: boolean;
  originalImagePreviews: string[];
  originalImageUrls: string[];
  stagedImageResults: string[];
  currentProjectId: string | null;
  setUploadedImages: (files: File[]) => void;
  setStagingInstructions: (instructions: string) => void;
  setReferenceImage: (file: File | null) => void;
  setReferenceImageUrl: (url: string | null) => void;
  setOriginalImagePreviews: (previews: string[]) => void;
  setOriginalImageUrls: (urls: string[]) => void;
  setStagedImageResults: (results: string[]) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsComplete: (isComplete: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
  setCurrentProjectId: (id: string | null) => void;
  handleImagesSelected: (files: File[]) => void;
  handleImageUrlsReady: (urls: string[]) => void;
  handleInstructionsChange: (instructions: string) => void;
  handleReferenceImageChange: (file: File | null) => void;
  handleReferenceImageUpload: (url: string | null) => void;
  handleEdit: (instructions: string) => void;
  resetState: () => void;
}

const StagingContext = createContext<StagingContextType | undefined>(undefined);

export function StagingProvider({ children }: { children: ReactNode }) {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [stagingInstructions, setStagingInstructions] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalImagePreviews, setOriginalImagePreviews] = useState<string[]>([]);
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([]);
  const [stagedImageResults, setStagedImageResults] = useState<string[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleImagesSelected = (files: File[]) => {
    setUploadedImages(files);
    
    const imagePreviews = files.map(file => URL.createObjectURL(file));
    setOriginalImagePreviews(imagePreviews);
  };

  const handleImageUrlsReady = (urls: string[]) => {
    setOriginalImageUrls(urls);
  };

  const handleInstructionsChange = (instructions: string) => {
    setStagingInstructions(instructions);
  };

  const handleReferenceImageChange = (file: File | null) => {
    setReferenceImage(file);
  };

  const handleReferenceImageUpload = (url: string | null) => {
    setReferenceImageUrl(url);
  };

  const createFinalInstructions = (additionalInstructions?: string) => {
    let finalInstructions = stagingInstructions.trim();
    
    if (additionalInstructions) {
      finalInstructions = additionalInstructions.trim();
    } else if (finalInstructions.length === 0) {
      finalInstructions = 'Stage this room to look modern, stylish, and inviting with appropriate furniture.';
    }
    
    return finalInstructions;
  };

  const handleEdit = async (editInstructions: string) => {
    if (!currentProjectId) {
      toast.error('Cannot edit without an active project');
      return;
    }
    
    setIsProcessing(true);
    setIsComplete(false);
    
    try {
      const finalInstructions = createFinalInstructions(editInstructions);
      
      console.log('Editing staged images for project:', currentProjectId);
      await generateStagedImages(
        currentProjectId,
        originalImageUrls[0],
        finalInstructions
      );
      
      toast.info('Re-generating staged room with your edits. This may take a few minutes.');
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing staged room:', error);
      setIsProcessing(false);
      toast.error('An error occurred while editing. Please try again.');
    }
  };

  const resetState = () => {
    originalImagePreviews.forEach(url => URL.revokeObjectURL(url));
    
    setUploadedImages([]);
    setStagingInstructions('');
    setReferenceImage(null);
    setReferenceImageUrl(null);
    setIsProcessing(false);
    setIsComplete(false);
    setIsEditing(false);
    setOriginalImagePreviews([]);
    setOriginalImageUrls([]);
    setStagedImageResults([]);
    setCurrentProjectId(null);
    
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  return (
    <StagingContext.Provider
      value={{
        uploadedImages,
        stagingInstructions,
        referenceImage,
        referenceImageUrl,
        isProcessing,
        isComplete,
        isEditing,
        originalImagePreviews,
        originalImageUrls,
        stagedImageResults,
        currentProjectId,
        setUploadedImages,
        setStagingInstructions,
        setReferenceImage,
        setReferenceImageUrl,
        setOriginalImagePreviews,
        setOriginalImageUrls,
        setStagedImageResults,
        setIsProcessing,
        setIsComplete,
        setIsEditing,
        setCurrentProjectId,
        handleImagesSelected,
        handleImageUrlsReady,
        handleInstructionsChange,
        handleReferenceImageChange,
        handleReferenceImageUpload,
        handleEdit,
        resetState
      }}
    >
      {children}
    </StagingContext.Provider>
  );
}

export function useStagingContext() {
  const context = useContext(StagingContext);
  if (context === undefined) {
    throw new Error('useStagingContext must be used within a StagingProvider');
  }
  return context;
}
