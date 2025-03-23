
import { useState } from 'react';
import { Upload, X, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { uploadImage } from '@/services/fileStorageService';

interface ReferenceImageUploaderProps {
  onReferenceImageChange: (file: File | null) => void;
  onReferenceImageUpload?: (url: string | null) => void;
}

const ReferenceImageUploader = ({ 
  onReferenceImageChange, 
  onReferenceImageUpload 
}: ReferenceImageUploaderProps) => {
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  return (
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
  );
};

export default ReferenceImageUploader;
