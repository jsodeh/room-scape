
import { FurnitureItem } from '@/types/database';
import { useProjectPolling } from './useProjectPolling';
import { useStagingSubmission } from './useStagingSubmission';
import { useStagingRegeneration } from './useStagingRegeneration';
import { useErrorReporting } from './useErrorReporting';

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
  // Set up error reporting
  const { errors, hasErrors, getFirstError } = useErrorReporting();

  // Set up polling for project status updates
  const { resetPolling } = useProjectPolling({
    projectId: currentProjectId,
    onComplete: setStagedImageResults,
    onProcessingChange: setIsProcessing,
    onCompleteChange: setIsComplete
  });

  // Set up submission functionality
  const { handleSubmit } = useStagingSubmission({
    userId,
    originalImageUrls,
    selectedFurniture,
    stagingInstructions,
    referenceImageUrl,
    setCurrentProjectId,
    setIsProcessing
  });

  // Set up regeneration functionality
  const { handleRegenerate } = useStagingRegeneration({
    userId,
    currentProjectId,
    originalImageUrls,
    selectedFurniture,
    stagingInstructions,
    referenceImageUrl,
    setIsProcessing,
    setIsComplete
  });

  return {
    handleSubmit,
    handleRegenerate,
    errors,
    hasErrors,
    getFirstError
  };
}
