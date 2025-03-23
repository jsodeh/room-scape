
import { Lightbulb } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface PromptTemplatesProps {
  onTemplateSelect: (template: string) => void;
}

export const PROMPT_TEMPLATES = [
  {
    id: 'modern-living',
    title: 'Modern Living Room',
    description: 'Clean lines, neutral colors, and minimalist furniture',
    prompt: 'Stage this room as a modern living room with clean lines and a neutral color palette. Include a comfortable sofa, coffee table, and minimal decor. Add subtle accent pieces for visual interest.',
  },
  {
    id: 'cozy-bedroom',
    title: 'Cozy Bedroom',
    description: 'Warm, inviting space with soft textures',
    prompt: 'Transform this space into a cozy bedroom with warm colors and soft textures. Include a well-dressed bed with plush pillows, bedside tables with lamps, and a comfortable reading nook if space allows.',
  },
  {
    id: 'home-office',
    title: 'Home Office',
    description: 'Functional workspace with stylish elements',
    prompt: 'Create a functional home office with a stylish desk, ergonomic chair, and organized storage solutions. Add good lighting, some plants, and minimal decor to keep the space productive yet visually appealing.',
  },
  {
    id: 'dining-area',
    title: 'Dining Area',
    description: 'Elegant dining setup for entertaining',
    prompt: 'Stage this as a dining area with an elegant table and comfortable chairs. Include appropriate lighting above the table, table settings, and subtle decor. Make it suitable for both everyday meals and entertaining guests.',
  },
];

const PromptTemplates = ({ onTemplateSelect }: PromptTemplatesProps) => {
  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <Label className="text-base">Quick Templates</Label>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Select a pre-made template to stage your room quickly
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROMPT_TEMPLATES.map(template => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onTemplateSelect(template.prompt)}
          >
            <CardContent className="p-4">
              <div className="font-medium">{template.title}</div>
              <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PromptTemplates;
