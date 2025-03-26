
import { useProjectPolling } from './useProjectPolling';
import { useStagingSubmission } from './useStagingSubmission';
import { useErrorReporting } from './useErrorReporting';

interface StagingProcessorProps {
  userId?: string;
  originalImageUrls: string[];
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
  stagingInstructions,
  referenceImageUrl,
  currentProjectId,
  setCurrentProjectId,
  setStagedImageResults,
  setIsProcessing,
  setIsComplete
}: StagingProcessorProps) {
  // Set up error reporting
  const { errors, hasErrors, getFirstError, reportError, clearError } = useErrorReporting();

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
    stagingInstructions,
    referenceImageUrl,
    setCurrentProjectId,
    setIsProcessing,
    reportError,
    clearError
  });

  return {
    handleSubmit,
    errors,
    hasErrors,
    getFirstError
  };
}
