import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Plus, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/services/fileStorageService';

interface StageInstructionsProps {
  onInstructionsChange: (instructions: string) => void;
  onReferenceImageChange: (file: File | null) => void;
  onReferenceImageUpload?: (url: string | null) => void;
}

const STYLE_PRESETS = [
  { id: 'modern', name: 'Modern' },
  { id: 'minimalist', name: 'Minimalist' },
  { id: 'traditional', name: 'Traditional' },
  { id: 'scandinavian', name: 'Scandinavian' },
  { id: 'industrial', name: 'Industrial' },
  { id: 'mid-century', name: 'Mid-Century' },
  { id: 'bohemian', name: 'Bohemian' },
  { id: 'coastal', name: 'Coastal' },
];

const INSTRUCTION_EXAMPLES = [
  'Place the sofa against the longest wall',
  'Make it look cozy and inviting',
  'Use warm, neutral colors',
  'Add a coffee table in front of the sofa',
  'Include plants for a touch of nature',
  'Keep the space minimal and clean',
];

const StageInstructions = ({ 
  onInstructionsChange, 
  onReferenceImageChange,
  onReferenceImageUpload 
}: StageInstructionsProps) => {
  const [instructions, setInstructions] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleReferenceImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      setReferenceImage(file);
      onReferenceImageChange(file);
      
      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      setReferenceImagePreview(imageUrl);
      
      // Upload the reference image if the handler is provided
      if (onReferenceImageUpload) {
        setIsUploading(true);
        try {
          const uploadedUrl = await uploadImage(file, 'reference-images');
          if (uploadedUrl) {
            onReferenceImageUpload(uploadedUrl);
            toast.success('Reference image uploaded');
          } else {
            throw new Error('Failed to upload reference image');
          }
        } catch (error) {
          console.error('Error uploading reference image:', error);
          toast.error('Failed to upload reference image');
        } finally {
          setIsUploading(false);
        }
      } else {
        toast.success('Reference image selected');
      }
    }
  };

  const removeReferenceImage = () => {
    if (referenceImagePreview) {
      URL.revokeObjectURL(referenceImagePreview);
    }
    
    setReferenceImage(null);
    setReferenceImagePreview(null);
    onReferenceImageChange(null);
    if (onReferenceImageUpload) {
      onReferenceImageUpload(null);
    }
  };

  const addExampleInstruction = (example: string) => {
    const newInstructions = instructions ? `${instructions}\n${example}` : example;
    setInstructions(newInstructions);
    onInstructionsChange(newInstructions);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div>
          <Label htmlFor="stylePresets" className="text-base">Style Preferences</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Select styles to apply to your staged room
          </p>
          <div className="flex flex-wrap gap-2">
            {STYLE_PRESETS.map(style => (
              <Button
                key={style.id}
                variant={selectedStyles.includes(style.id) ? "default" : "outline"}
                className="rounded-full"
                onClick={() => handleStyleToggle(style.id)}
              >
                {style.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions" className="text-base">Staging Instructions</Label>
          <p className="text-sm text-muted-foreground">
            Provide specific instructions on how you'd like the room to be staged
          </p>
          <Textarea
            id="instructions"
            placeholder="E.g., Place the sofa against the longest wall, add plants for some greenery..."
            rows={5}
            value={instructions}
            onChange={handleInstructionsChange}
            className="resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {INSTRUCTION_EXAMPLES.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="rounded-full bg-secondary/50 hover:bg-secondary text-xs"
                onClick={() => addExampleInstruction(example)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {example}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="referenceImage" className="text-base">Reference Image (Optional)</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Upload a reference image showing the style or layout you prefer
        </p>
        
        {!referenceImagePreview ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
            <input
              type="file"
              id="referenceImage"
              accept="image/*"
              className="hidden"
              onChange={handleReferenceImageChange}
              disabled={isUploading}
            />
            <Label
              htmlFor="referenceImage"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="h-8 w-8 text-gray-400 mb-3" />
              <span className="text-sm font-medium">Upload reference image</span>
              <span className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB</span>
              <Button className="mt-4" size="sm" variant="secondary" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Choose Image'}
              </Button>
            </Label>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <img
              src={referenceImagePreview}
              alt="Reference"
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2">
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={removeReferenceImage}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-3 bg-gray-50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Reference image will guide the styling</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StageInstructions;
