
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, Loader2 } from 'lucide-react';

interface JsonActionButtonsProps {
  isProcessing: boolean;
  hasContent: boolean;
  onClear: () => void;
  onProcess: () => void;
}

const JsonActionButtons = ({ 
  isProcessing, 
  hasContent,
  onClear, 
  onProcess 
}: JsonActionButtonsProps) => {
  return (
    <div className="flex justify-between">
      <Button 
        variant="outline" 
        onClick={onClear}
        disabled={!hasContent || isProcessing}
      >
        Clear
      </Button>
      <Button 
        onClick={onProcess}
        disabled={!hasContent || isProcessing}
        className="gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ArrowDownToLine className="h-4 w-4" />
            Process JSON
          </>
        )}
      </Button>
    </div>
  );
};

export default JsonActionButtons;
