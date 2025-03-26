
import { useState } from 'react';
import { FurnitureItem } from '@/types/database';
import { useProjectPolling } from './useProjectPolling';
import { useStagingSubmission } from './useStagingSubmission';
import { useStagingRegeneration } from './useStagingRegeneration';

interface StagingProcessorProps {
  userId?: string;
  originalImageUrls: string[];
  selectedFurniture: FurnitureItem[];
  stagingInstructions: string;
  referenceImageUrl: string | null;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  setStagedImageResults: (results: string[]) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsComplete: (isComplete: boolean) => void;
}

export function useStagingProcessor({
  userId,
  originalImageUrls,
  selectedFurniture,
  stagingInstructions,
  referenceImageUrl,
  currentProjectId,
  setCurrentProjectId,
  setStagedImageResults,
  setIsProcessing,
  setIsComplete
}: StagingProcessorProps) {
  // Set up polling for project status updates
  const { lastError: pollingError, resetPolling } = useProjectPolling({
    projectId: currentProjectId,
    onComplete: setStagedImageResults,
    onProcessingChange: setIsProcessing,
    onCompleteChange: setIsComplete
  });

  // Set up submission functionality
  const { 
    handleSubmit, 
    lastError: submissionError 
  } = useStagingSubmission({
    userId,
    originalImageUrls,
    selectedFurniture,
    stagingInstructions,
    referenceImageUrl,
    setCurrentProjectId,
    setIsProcessing
  });

  // Set up regeneration functionality
  const { 
    handleRegenerate, 
    lastError: regenerationError 
  } = useStagingRegeneration({
    userId,
    currentProjectId,
    originalImageUrls,
    selectedFurniture,
    stagingInstructions,
    referenceImageUrl,
    setIsProcessing,
    setIsComplete
  });

  // Combine errors from all sources
  const lastError = pollingError || submissionError || regenerationError;

  return {
    handleSubmit,
    handleRegenerate,
    lastError
  };
}
