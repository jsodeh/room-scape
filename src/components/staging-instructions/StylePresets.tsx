
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface StylePresetsProps {
  selectedStyles: string[];
  onStyleToggle: (styleId: string) => void;
}

export const STYLE_PRESETS = [
  { id: 'modern', name: 'Modern' },
  { id: 'minimalist', name: 'Minimalist' },
  { id: 'traditional', name: 'Traditional' },
  { id: 'scandinavian', name: 'Scandinavian' },
  { id: 'industrial', name: 'Industrial' },
  { id: 'mid-century', name: 'Mid-Century' },
  { id: 'bohemian', name: 'Bohemian' },
  { id: 'coastal', name: 'Coastal' },
];

const StylePresets = ({ selectedStyles, onStyleToggle }: StylePresetsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {STYLE_PRESETS.map(style => (
        <Button
          key={style.id}
          variant={selectedStyles.includes(style.id) ? "default" : "outline"}
          className="rounded-full"
          onClick={() => onStyleToggle(style.id)}
        >
          {style.name}
        </Button>
      ))}
    </div>
  );
};

export default StylePresets;
