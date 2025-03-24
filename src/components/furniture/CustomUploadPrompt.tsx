
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface CustomUploadPromptProps {
  onUploadClick: () => void;
}

const CustomUploadPrompt = ({ onUploadClick }: CustomUploadPromptProps) => {
  return (
    <div className="border-2 border-dashed rounded-lg p-4 text-center animate-fade-in">
      <div className="space-y-4">
        <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium">Upload Your Furniture</h3>
        <p className="text-sm text-muted-foreground">
          Add your own furniture images to include in staging
          <span className="block text-xs mt-1 text-amber-600 font-medium animate-pulse">Premium Feature</span>
        </p>
        <Button 
          onClick={onUploadClick}
          className="transition-transform duration-300 hover:scale-105"
        >
          Upload Custom Furniture
        </Button>
      </div>
    </div>
  );
};

export default CustomUploadPrompt;
