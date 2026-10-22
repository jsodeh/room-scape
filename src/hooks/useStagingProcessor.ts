import { useProjectPolling } from "./useProjectPolling";
import { useStagingSubmission } from "./useStagingSubmission";
import { useErrorReporting } from "./useErrorReporting";
interface StagingProcessorProps {
  userId?: string;
  originalImageUrls: string[];
  stagingInstructions: string;
  referenceImageUrl: string | null;
  currentProjectId: string | null;
  isProcessing: boolean;
  setCurrentProjectId: (id: string | null) => void;
  setStagedImageResults: (results: string[]) => void;
  setIsProcessing: (processing: boolean) => void;
  setIsComplete: (complete: boolean) => void;
}
export function useStagingProcessor(props: StagingProcessorProps) {
  const reporting = useErrorReporting();
  useProjectPolling({
    projectId: props.currentProjectId,
    enabled: props.isProcessing,
    onComplete: props.setStagedImageResults,
    onProcessingChange: props.setIsProcessing,
    onCompleteChange: props.setIsComplete,
    onError: (message) => reporting.reportError("polling", message),
  });
  const submission = useStagingSubmission({
    ...props,
    reportError: reporting.reportError,
    clearError: () => reporting.clearError(),
  });
  return { ...submission, ...reporting };
}
