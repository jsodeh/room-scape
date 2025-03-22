
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { FurnitureItem } from '@/services/storageService';

interface StagingContextType {
  uploadedImages: File[];
  selectedFurniture: FurnitureItem[];
  stagingInstructions: string;
  referenceImage: File | null;
  isProcessing: boolean;
  isComplete: boolean;
  originalImagePreviews: string[];
  originalImageUrls: string[];
  stagedImageResults: string[];
  currentProjectId: string | null;
  setUploadedImages: (files: File[]) => void;
  setSelectedFurniture: (items: FurnitureItem[]) => void;
  setStagingInstructions: (instructions: string) => void;
  setReferenceImage: (file: File | null) => void;
  setOriginalImagePreviews: (previews: string[]) => void;
  setOriginalImageUrls: (urls: string[]) => void;
  setStagedImageResults: (results: string[]) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsComplete: (isComplete: boolean) => void;
  setCurrentProjectId: (id: string | null) => void;
  handleImagesSelected: (files: File[]) => void;
  handleImageUrlsReady: (urls: string[]) => void;
  handleFurnitureSelected: (items: FurnitureItem[]) => void;
  handleInstructionsChange: (instructions: string) => void;
  handleReferenceImageChange: (file: File | null) => void;
  resetState: () => void;
}

const StagingContext = createContext<StagingContextType | undefined>(undefined);

export function StagingProvider({ children }: { children: ReactNode }) {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem[]>([]);
  const [stagingInstructions, setStagingInstructions] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [originalImagePreviews, setOriginalImagePreviews] = useState<string[]>([]);
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([]);
  const [stagedImageResults, setStagedImageResults] = useState<string[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleImagesSelected = (files: File[]) => {
    setUploadedImages(files);
    
    // Create preview URLs for original images
    const imagePreviews = files.map(file => URL.createObjectURL(file));
    setOriginalImagePreviews(imagePreviews);
  };

  const handleImageUrlsReady = (urls: string[]) => {
    setOriginalImageUrls(urls);
  };

  const handleFurnitureSelected = (items: FurnitureItem[]) => {
    setSelectedFurniture(items);
  };

  const handleInstructionsChange = (instructions: string) => {
    setStagingInstructions(instructions);
  };

  const handleReferenceImageChange = (file: File | null) => {
    setReferenceImage(file);
  };

  const resetState = () => {
    // Clean up object URLs to prevent memory leaks
    originalImagePreviews.forEach(url => URL.revokeObjectURL(url));
    
    setUploadedImages([]);
    setSelectedFurniture([]);
    setStagingInstructions('');
    setReferenceImage(null);
    setIsProcessing(false);
    setIsComplete(false);
    setOriginalImagePreviews([]);
    setOriginalImageUrls([]);
    setStagedImageResults([]);
    setCurrentProjectId(null);
    
    // Clear any polling interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  return (
    <StagingContext.Provider
      value={{
        uploadedImages,
        selectedFurniture,
        stagingInstructions,
        referenceImage,
        isProcessing,
        isComplete,
        originalImagePreviews,
        originalImageUrls,
        stagedImageResults,
        currentProjectId,
        setUploadedImages,
        setSelectedFurniture,
        setStagingInstructions,
        setReferenceImage,
        setOriginalImagePreviews,
        setOriginalImageUrls,
        setStagedImageResults,
        setIsProcessing,
        setIsComplete,
        setCurrentProjectId,
        handleImagesSelected,
        handleImageUrlsReady,
        handleFurnitureSelected,
        handleInstructionsChange,
        handleReferenceImageChange,
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
