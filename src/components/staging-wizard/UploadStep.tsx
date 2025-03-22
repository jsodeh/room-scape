
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { useStagingContext } from '@/context/StagingContext';

interface UploadStepProps {
  goToNextStep: () => void;
}

const UploadStep = ({ goToNextStep }: UploadStepProps) => {
  const { 
    handleImagesSelected, 
    handleImageUrlsReady,
    uploadedImages,
    originalImageUrls
  } = useStagingContext();

  const isStepComplete = uploadedImages.length > 0 && originalImageUrls.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-medium">Upload Room Images</h2>
        <p className="text-sm text-muted-foreground">
          Upload one or more images of the room you want to stage. We accept JPG and PNG formats.
        </p>
      </div>
      
      <ImageUpload 
        onImagesSelected={handleImagesSelected} 
        onImageUrlsReady={handleImageUrlsReady}
      />
      
      <div className="flex justify-end">
        <Button 
          onClick={goToNextStep} 
          disabled={!isStepComplete}
          className="gap-2"
        >
          Next Step <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default UploadStep;
