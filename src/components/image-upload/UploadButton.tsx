
import { UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadButtonProps {
  onUpload: () => Promise<void>;
  isUploading: boolean;
  disabled: boolean;
}

const UploadButton = ({ onUpload, isUploading, disabled }: UploadButtonProps) => {
  return (
    <div className="flex justify-end">
      <Button 
        onClick={onUpload} 
        disabled={isUploading || disabled}
        className="gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4" />
            Upload to Storage
          </>
        )}
      </Button>
    </div>
  );
};

export default UploadButton;
