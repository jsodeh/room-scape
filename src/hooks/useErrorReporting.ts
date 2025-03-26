
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

type ErrorCategory = 'submission' | 'processing' | 'regeneration' | 'polling' | 'general';

interface ErrorReportingOptions {
  showToasts?: boolean;
}

export function useErrorReporting(options: ErrorReportingOptions = { showToasts: true }) {
  const [errors, setErrors] = useState<Record<ErrorCategory, string | null>>({
    submission: null,
    processing: null,
    regeneration: null,
    polling: null,
    general: null
  });

  const reportError = useCallback((category: ErrorCategory, message: string, error?: unknown) => {
    // Log to console for debugging
    console.error(`Staging error (${category}):`, message, error);
    
    // Update the errors state
    setErrors(prev => ({
      ...prev,
      [category]: message
    }));

    // Show toast notification if enabled
    if (options.showToasts) {
      const toastMessage = `Error in ${category}: ${message}`;
      toast.error(toastMessage);
    }

    return message;
  }, [options.showToasts]);

  const clearError = useCallback((category?: ErrorCategory) => {
    if (category) {
      setErrors(prev => ({
        ...prev,
        [category]: null
      }));
    } else {
      setErrors({
        submission: null,
        processing: null,
        regeneration: null,
        polling: null,
        general: null
      });
    }
  }, []);

  const hasErrors = useCallback(() => {
    return Object.values(errors).some(error => error !== null);
  }, [errors]);

  const getFirstError = useCallback(() => {
    for (const category of Object.keys(errors) as ErrorCategory[]) {
      if (errors[category]) {
        return {
          category,
          message: errors[category]
        };
      }
    }
    return null;
  }, [errors]);

  return {
    errors,
    reportError,
    clearError,
    hasErrors,
    getFirstError
  };
}
