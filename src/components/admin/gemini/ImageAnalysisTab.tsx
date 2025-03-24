
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CardContent } from '@/components/ui/card';
import ImageUpload from '@/components/image-upload/ImageUpload';
import { ImageAnalysisTabProps } from './types';

const ImageAnalysisTab: React.FC<ImageAnalysisTabProps> = ({ 
  customPrompt,
  setCustomPrompt,
  onImageUrlsReady
}) => {
  return (
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label>Upload Product Image</Label>
        <ImageUpload
          maxFiles={1}
          acceptedFileTypes="image/*"
          onImagesSelected={() => {}}
          onImageUrlsReady={onImageUrlsReady}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="customPrompt">Custom Instructions (Optional)</Label>
        <Textarea
          id="customPrompt"
          placeholder="Add specific instructions for the AI analysis..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="resize-none h-20"
        />
      </div>
    </CardContent>
  );
};

export default ImageAnalysisTab;
