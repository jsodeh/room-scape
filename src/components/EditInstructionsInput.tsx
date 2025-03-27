
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Send } from 'lucide-react';

interface EditInstructionsInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

const EDIT_SUGGESTIONS = [
  'Make it more modern',
  'Add more plants',
  'Use warmer colors',
  'Make it more minimalist',
  'Add artwork to the walls',
  'Improve the lighting',
];

const EditInstructionsInput = ({ value, onChange, onSubmit, isProcessing }: EditInstructionsInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Append the suggestion to the current value
    onChange(prev => {
      if (!prev.trim()) return suggestion;
      return `${prev.trim()}. ${suggestion}`;
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white border rounded-lg p-4 shadow-sm mt-4">
      <h3 className="text-lg font-medium mb-3">Edit This Staging</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Provide specific instructions on how you'd like to modify this staged room
      </p>
      
      <div className="space-y-4">
        <Textarea
          placeholder="E.g., Add more plants, change wall color to blue..."
          value={value}
          onChange={handleChange}
          className="min-h-[100px] resize-none"
        />
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Quick Edits</p>
          <div className="flex flex-wrap gap-2">
            {EDIT_SUGGESTIONS.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="rounded-full bg-secondary/50 hover:bg-secondary text-xs"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            onClick={onSubmit}
            className="gap-2"
            disabled={isProcessing || !value.trim()}
          >
            {isProcessing ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Apply Edits
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditInstructionsInput;
