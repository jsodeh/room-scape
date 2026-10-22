import { useCallback, useEffect, useRef, useState } from "react";
import { getStagingProject } from "@/services/stagingService";
interface UseProjectPollingProps {
  projectId: string | null;
  enabled?: boolean;
  onComplete: (images: string[]) => void;
  onProcessingChange: (processing: boolean) => void;
  onCompleteChange: (complete: boolean) => void;
  onError?: (message: string) => void;
}
export function useProjectPolling({
  projectId,
  enabled = true,
  onComplete,
  onProcessingChange,
  onCompleteChange,
  onError,
}: UseProjectPollingProps) {
  const [restart, setRestart] = useState(0);
  const callbacks = useRef({
    onComplete,
    onProcessingChange,
    onCompleteChange,
    onError,
  });
  callbacks.current = {
    onComplete,
    onProcessingChange,
    onCompleteChange,
    onError,
  };
  useEffect(() => {
    if (!projectId || !enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    const poll = async () => {
      if (cancelled) return;
      if (Date.now() - started > 5 * 60 * 1000) {
        callbacks.current.onProcessingChange(false);
        callbacks.current.onError?.(
          "This design is taking longer than expected. Check its status in Projects before trying again.",
        );
        return;
      }
      try {
        const project = await getStagingProject(projectId);
        if (cancelled) return;
        if (project?.status === "completed") {
          callbacks.current.onProcessingChange(false);
          if (project.staged_images?.length) {
            callbacks.current.onComplete(project.staged_images);
            callbacks.current.onCompleteChange(true);
          } else
            callbacks.current.onError?.(
              "No image was returned. Please try a different design brief.",
            );
          return;
        }
        if (project?.status === "failed") {
          callbacks.current.onProcessingChange(false);
          callbacks.current.onError?.(
            "This design could not be completed. Please try again.",
          );
          return;
        }
      } catch {
        /* A temporary connection failure can recover on the next poll. */
      }
      if (!cancelled) timer = setTimeout(poll, 5000);
    };
    timer = setTimeout(poll, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [projectId, enabled, restart]);
  const resetPolling = useCallback(() => setRestart((value) => value + 1), []);
  return { resetPolling };
}
