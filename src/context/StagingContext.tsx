import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { StagingContextType } from "./staging/types";
import { initialStagingState } from "./staging/stagingState";
import {
  createImagesSelectedHandler,
  createEditSubmitHandler,
  createEditHandler,
  createResetStateHandler,
} from "./staging/stagingHandlers";

const StagingContext = createContext<StagingContextType | undefined>(undefined);

export function StagingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const previousUser = useRef<string | null>(null);
  // Initialize state using our initial state object
  const [uploadedImages, setUploadedImages] = useState<File[]>(
    initialStagingState.uploadedImages,
  );
  const [stagingInstructions, setStagingInstructions] = useState(
    initialStagingState.stagingInstructions,
  );
  const [editInstructions, setEditInstructions] = useState(
    initialStagingState.editInstructions,
  );
  const [isEditMode, setIsEditMode] = useState(initialStagingState.isEditMode);
  const [referenceImage, setReferenceImage] = useState<File | null>(
    initialStagingState.referenceImage,
  );
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(
    initialStagingState.referenceImageUrl,
  );
  const [isProcessing, setIsProcessing] = useState(
    initialStagingState.isProcessing,
  );
  const [isComplete, setIsComplete] = useState(initialStagingState.isComplete);
  const [originalImagePreviews, setOriginalImagePreviews] = useState<string[]>(
    initialStagingState.originalImagePreviews,
  );
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>(
    initialStagingState.originalImageUrls,
  );
  const [stagedImageResults, setStagedImageResults] = useState<string[]>(
    initialStagingState.stagedImageResults,
  );
  const [stagedImageHistory, setStagedImageHistory] = useState<string[][]>(
    initialStagingState.stagedImageHistory,
  );
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    initialStagingState.currentProjectId,
  );
  const [pollingInterval, setPollingInterval] = useState<number | null>(
    initialStagingState.pollingInterval,
  );

  // Clear polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  useEffect(
    () => () => {
      originalImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    },
    [originalImagePreviews],
  );

  // Track staged image history when results change
  useEffect(() => {
    if (stagedImageResults.length > 0 && isComplete) {
      void queryClient.invalidateQueries({
        queryKey: ["staging-projects", user?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["staging-project", user?.id, currentProjectId],
      });
      setStagedImageHistory((prevHistory) =>
        JSON.stringify(prevHistory[prevHistory.length - 1]) ===
        JSON.stringify(stagedImageResults)
          ? prevHistory
          : [...prevHistory, [...stagedImageResults]],
      );
    }
  }, [stagedImageResults, isComplete, queryClient, user?.id, currentProjectId]);

  // Create handlers using our factory functions
  const handleImagesSelected = createImagesSelectedHandler(
    setUploadedImages,
    setOriginalImagePreviews,
  );

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

  const handleEdit = createEditHandler(setEditInstructions, setIsEditMode);

  const handleEditSubmit = createEditSubmitHandler(
    currentProjectId,
    stagedImageResults,
    editInstructions,
    setIsProcessing,
    setIsComplete,
    setIsEditMode,
    setStagedImageResults,
  );

  const resetState = createResetStateHandler(
    originalImagePreviews,
    setUploadedImages,
    setStagingInstructions,
    setEditInstructions,
    setIsEditMode,
    setReferenceImage,
    setReferenceImageUrl,
    setIsProcessing,
    setIsComplete,
    setOriginalImagePreviews,
    setOriginalImageUrls,
    setStagedImageResults,
    setStagedImageHistory,
    setCurrentProjectId,
    pollingInterval,
    setPollingInterval,
  );

  const resetRef = useRef(resetState);
  resetRef.current = resetState;
  useEffect(() => {
    if (previousUser.current && previousUser.current !== (user?.id || null))
      resetRef.current();
    previousUser.current = user?.id || null;
  }, [user?.id]);

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
        stagedImageHistory,
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
        setStagedImageHistory,
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
        resetState,
      }}
    >
      {children}
    </StagingContext.Provider>
  );
}

export function useStagingContext() {
  const context = useContext(StagingContext);
  if (context === undefined) {
    throw new Error("useStagingContext must be used within a StagingProvider");
  }
  return context;
}
