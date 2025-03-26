import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getStagingProject } from '@/services/stagingService';

interface UseProjectPollingProps {
  projectId: string | null;
  onComplete: (stagedImages: string[]) => void;
  onProcessingChange: (isProcessing: boolean) => void;
  onCompleteChange: (isComplete: boolean) => void;
}

export function useProjectPolling({
  projectId,
  onComplete,
  onProcessingChange,
  onCompleteChange
}: UseProjectPollingProps) {
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Poll for project status updates
  useEffect(() => {
    if (projectId && onProcessingChange) {
      const MAX_POLLING_COUNT = 60; // 5 minutes max (5000ms * 60)
      
      const interval = window.setInterval(async () => {
        try {
          setPollingCount(prev => prev + 1);
          
          // If we've been polling for too long, assume something went wrong
          if (pollingCount > MAX_POLLING_COUNT) {
            onProcessingChange(false);
            clearInterval(interval);
            toast.error('Staging timed out. Please try again with a smaller image or different instructions.');
            console.error('Staging timed out after maximum polling attempts');
            return;
          }
          
          console.log(`Polling project status (attempt ${pollingCount})...`);
          const project = await getStagingProject(projectId);
          
          if (project) {
            console.log(`Project status: ${project.status}`, project);
            
            if (project.status === 'completed') {
              if (project.staged_images && project.staged_images.length > 0) {
                onComplete(project.staged_images);
                onProcessingChange(false);
                onCompleteChange(true);
                clearInterval(interval);
                toast.success('Staging complete! Check out your results.');
                console.log('Staging completed successfully');
              } else {
                onProcessingChange(false);
                clearInterval(interval);
                toast.error('No images were generated. Please try again with different settings.');
                console.error('Project marked as completed but no images were returned');
              }
            } else if (project.status === 'failed') {
              onProcessingChange(false);
              clearInterval(interval);
              const errorMessage = project.error_message || 'Staging failed. Please try again.';
              toast.error(errorMessage);
              console.error('Project failed with message:', errorMessage);
              setLastError(errorMessage);
            } else {
              // Still processing, keep polling
              console.log(`Project status: ${project.status}`);
            }
          } else {
            console.error('Could not retrieve project data during polling');
          }
        } catch (error) {
          console.error('Error polling project status:', error);
        }
      }, 5000); // Poll every 5 seconds
      
      setPollingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [projectId, onProcessingChange, onComplete, onCompleteChange, pollingCount]);

  return { lastError, resetPolling: () => setPollingCount(0) };
}
