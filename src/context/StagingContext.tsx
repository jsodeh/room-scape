
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { generateStagedImages } from '@/services/stagingService';

interface StagingContextType {
  uploadedImages: File[];
  stagingInstructions: string;
  editInstructions: string;
  isEditMode: boolean;
  referenceImage: File | null;
  referenceImageUrl: string | null;
  isProcessing: boolean;
  isComplete: boolean;
  originalImagePreviews: string[];
  originalImageUrls: string[];
  stagedImageResults: string[];
  currentProjectId: string | null;
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

const StagingContext = createContext<StagingContextType | undefined>(undefined);

export function StagingProvider({ children }: { children: ReactNode }) {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [stagingInstructions, setStagingInstructions] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
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

  const handleEditInstructionsChange = (instructions: string) => {
    setEditInstructions(instructions);
  };

  const handleReferenceImageChange = (file: File | null) => {
    setReferenceImage(file);
  };

  const handleReferenceImageUpload = (url: string | null) => {
    setReferenceImageUrl(url);
  };

  const createFinalInstructions = () => {
    let finalInstructions = stagingInstructions.trim();
    if (finalInstructions.length === 0) {
      finalInstructions = 'Stage this room to look modern, stylish, and inviting with appropriate furniture.';
    }
    return finalInstructions;
  };

  const handleEdit = (initialInstructions?: string) => {
    if (initialInstructions) {
      setEditInstructions(initialInstructions);
    } else {
      setEditInstructions('');
    }
    setIsEditMode(true);
  };

  const handleEditSubmit = async () => {
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

  const resetState = () => {
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

  return (
    <StagingContext.Provider
      value={{
        uploadedImages,
        stagingInstructions,
        editInstructions,
        isEditMode,
        referenceImage,
        referenceImageUrl,
        isProcessing,
        isComplete,
        originalImagePreviews,
        originalImageUrls,
        stagedImageResults,
        currentProjectId,
        setUploadedImages,
        setStagingInstructions,
        setEditInstructions,
        setIsEditMode,
        setReferenceImage,
        setReferenceImageUrl,
        setOriginalImagePreviews,
        setOriginalImageUrls,
        setStagedImageResults,
        setIsProcessing,
        setIsComplete,
        setCurrentProjectId,
        handleImagesSelected,
        handleImageUrlsReady,
        handleInstructionsChange,
        handleEditInstructionsChange,
        handleReferenceImageChange,
        handleReferenceImageUpload,
        handleEdit,
        handleEditSubmit,
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
