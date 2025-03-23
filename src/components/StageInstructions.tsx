
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import StylePresets, { STYLE_PRESETS } from './staging-instructions/StylePresets';
import PromptTemplates from './staging-instructions/PromptTemplates';
import InstructionsInput from './staging-instructions/InstructionsInput';
import InstructionSuggestions from './staging-instructions/InstructionSuggestions';
import ReferenceImageUploader from './staging-instructions/ReferenceImageUploader';

interface StageInstructionsProps {
  onInstructionsChange: (instructions: string) => void;
  onReferenceImageChange: (file: File | null) => void;
  onReferenceImageUpload?: (url: string | null) => void;
}

const StageInstructions = ({ 
  onInstructionsChange, 
  onReferenceImageChange,
  onReferenceImageUpload 
}: StageInstructionsProps) => {
  const [instructions, setInstructions] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInstructions(e.target.value);
    onInstructionsChange(e.target.value);
  };

  const handleStyleToggle = (styleId: string) => {
    if (selectedStyles.includes(styleId)) {
      const newStyles = selectedStyles.filter(id => id !== styleId);
      setSelectedStyles(newStyles);
      updateInstructions(newStyles);
    } else {
      const newStyles = [...selectedStyles, styleId];
      setSelectedStyles(newStyles);
      updateInstructions(newStyles);
    }
  };

  const updateInstructions = (styles: string[]) => {
    const styleText = styles.length > 0 
      ? `Style preferences: ${styles.map(id => STYLE_PRESETS.find(style => style.id === id)?.name).join(', ')}. `
      : '';
      
    const updatedInstructions = styleText + instructions;
    onInstructionsChange(updatedInstructions);
  };

  const addExampleInstruction = (example: string) => {
    const newInstructions = instructions ? `${instructions}\n${example}` : example;
    setInstructions(newInstructions);
    onInstructionsChange(newInstructions);
  };

  const applyPromptTemplate = (template: string) => {
    setInstructions(template);
    onInstructionsChange(template);
    toast.success('Template applied');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Style Preferences Section */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="stylePresets" className="text-base">Style Preferences</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Select styles to apply to your staged room
          </p>
          <StylePresets 
            selectedStyles={selectedStyles} 
            onStyleToggle={handleStyleToggle}
          />
        </div>

        {/* Prompt Templates Section */}
        <PromptTemplates onTemplateSelect={applyPromptTemplate} />

        {/* Manual Instructions Section */}
        <InstructionsInput 
          instructions={instructions} 
          onInstructionsChange={handleInstructionsChange} 
        />
        
        <InstructionSuggestions onSuggestionClick={addExampleInstruction} />
      </div>
      
      {/* Reference Image Section */}
      <ReferenceImageUploader 
        onReferenceImageChange={onReferenceImageChange}
        onReferenceImageUpload={onReferenceImageUpload}
      />
    </div>
  );
};

export default StageInstructions;
