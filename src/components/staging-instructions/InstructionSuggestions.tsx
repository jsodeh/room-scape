
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstructionSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

export const INSTRUCTION_EXAMPLES = [
  'Place the sofa against the longest wall',
  'Make it look cozy and inviting',
  'Use warm, neutral colors',
  'Add a coffee table in front of the sofa',
  'Include plants for a touch of nature',
  'Keep the space minimal and clean',
];

const InstructionSuggestions = ({ onSuggestionClick }: InstructionSuggestionsProps) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Suggestions</p>
      <div className="flex flex-wrap gap-2">
        {INSTRUCTION_EXAMPLES.map((example, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="rounded-full bg-secondary/50 hover:bg-secondary text-xs"
            onClick={() => onSuggestionClick(example)}
          >
            <Plus className="h-3 w-3 mr-1" />
            {example}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default InstructionSuggestions;
