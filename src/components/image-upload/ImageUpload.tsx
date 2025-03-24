
import { useRef } from 'react';
import { Check } from 'lucide-react';
import { useImageUploader } from '@/hooks/useImageUploader';
import DropZone from './DropZone';
import ImagePreview from './ImagePreview';
import UploadButton from './UploadButton';

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  onImageUrlsReady?: (urls: string[]) => void;
  maxFiles?: number;
}

const ImageUpload = ({ onImagesSelected, onImageUrlsReady, maxFiles = 10 }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    selectedFiles,
    previews,
    uploading,
    handleFileSelect,
    removeFile,
    handleUploadToStorage
  } = useImageUploader({
    onImagesSelected,
    onImageUrlsReady,
    maxFiles
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <DropZone 
        onFileSelect={handleFileSelect} 
        fileInputRef={fileInputRef} // Pass the ref to DropZone
      />

      {previews.length > 0 && (
        <>
          <div className="flex items-center text-sm text-gray-500 gap-1">
            <Check className="h-4 w-4 text-green-500" />
            <span>{selectedFiles.length} image{selectedFiles.length === 1 ? '' : 's'}</span>
          </div>
          
          <ImagePreview 
            previews={previews} 
            onRemove={removeFile} 
            onAddMore={() => fileInputRef.current?.click()} 
          />

          {onImageUrlsReady && (
            <UploadButton 
              onUpload={handleUploadToStorage} 
              isUploading={uploading} 
              disabled={selectedFiles.length === 0} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default ImageUpload;

