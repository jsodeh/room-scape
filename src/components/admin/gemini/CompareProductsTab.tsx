
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CardContent } from '@/components/ui/card';
import ImageUpload from '@/components/image-upload/ImageUpload';
import { CompareProductsTabProps } from './types';

const CompareProductsTab: React.FC<CompareProductsTabProps> = ({ 
  customPrompt,
  setCustomPrompt,
  onImageUrlsReady
}) => {
  return (
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label>Upload Multiple Product Images to Compare</Label>
        <ImageUpload
          maxFiles={4}
          acceptedFileTypes="image/*"
          onImagesSelected={() => {}}
          onImageUrlsReady={onImageUrlsReady}
        />
        <p className="text-xs text-muted-foreground">Upload 2-4 images to compare products</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="comparePrompt">Custom Instructions (Optional)</Label>
        <Textarea
          id="comparePrompt"
          placeholder="Add specific instructions for the comparison..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="resize-none h-20"
        />
      </div>
    </CardContent>
  );
};

export default CompareProductsTab;
