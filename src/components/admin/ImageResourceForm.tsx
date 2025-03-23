
import React from 'react';
import ImageUpload from '@/components/ImageUpload';

interface ImageResourceFormProps {
  imageUrl: string | undefined;
  onImagesSelected: (files: File[]) => void;
  onImageUrlsReady: (urls: string[]) => void;
}

const ImageResourceForm = ({ 
  imageUrl, 
  onImagesSelected, 
  onImageUrlsReady 
}: ImageResourceFormProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Upload Image</label>
      <ImageUpload
        onImagesSelected={onImagesSelected}
        onImageUrlsReady={onImageUrlsReady}
        maxFiles={1}
      />
      {imageUrl && (
        <div className="mt-2">
          <p className="text-sm font-medium mb-2">Current Image:</p>
          <div className="h-28 w-28 rounded overflow-hidden border">
            <img
              src={imageUrl}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageResourceForm;
