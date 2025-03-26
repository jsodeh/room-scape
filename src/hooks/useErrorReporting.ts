
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
    // Log to console for debugging with more details
    console.error(`Staging error (${category}):`, message, error);
    
    // Format error message based on error type
    let formattedMessage = message;
    
    // Extract more details if error is about Stability API
    if (typeof message === 'string' && message.includes('Stability')) {
      if (message.includes('401')) {
        formattedMessage = 'Invalid Stability API key. Please check your API key in Supabase secrets.';
      } else if (message.includes('429')) {
        formattedMessage = 'Stability API rate limit exceeded. Please try again later.';
      } else if (message.includes('Edge function')) {
        formattedMessage = 'Error connecting to Stability AI. Please check the Edge Function logs.';
      }
    }
    
    // Update the errors state
    setErrors(prev => ({
      ...prev,
      [category]: formattedMessage
    }));

    // Show toast notification if enabled
    if (options.showToasts) {
      const toastMessage = `Error: ${formattedMessage}`;
      toast.error(toastMessage, {
        duration: 5000
      });
    }

    return formattedMessage;
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
