
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import ImageUpload from '@/components/image-upload/ImageUpload';
import { PdfAnalysisTabProps } from './types';

const PdfAnalysisTab: React.FC<PdfAnalysisTabProps> = ({ 
  pdfUrl,
  customPrompt,
  setCustomPrompt,
  onPdfUrlsReady
}) => {
  const [externalPdfUrl, setExternalPdfUrl] = useState('');

  const handleExternalPdfUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExternalPdfUrl(e.target.value);
  };

  const handleUsePdfUrl = () => {
    if (!externalPdfUrl) {
      toast.error('Please enter a valid PDF URL');
      return;
    }
    onPdfUrlsReady([externalPdfUrl]);
  };

  return (
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label>Upload PDF Document</Label>
        <ImageUpload
          maxFiles={1}
          acceptedFileTypes="application/pdf"
          onImagesSelected={() => {}}
          onImageUrlsReady={onPdfUrlsReady}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="externalPdfUrl">Or Enter PDF URL</Label>
        <div className="flex gap-2">
          <Input
            id="externalPdfUrl"
            placeholder="https://example.com/document.pdf"
            value={externalPdfUrl}
            onChange={handleExternalPdfUrlChange}
          />
          <Button 
            variant="outline" 
            onClick={handleUsePdfUrl}
            type="button"
          >
            Use URL
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="pdfPrompt">Custom Instructions (Optional)</Label>
        <Textarea
          id="pdfPrompt"
          placeholder="Add specific instructions for the AI analysis..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="resize-none h-20"
        />
      </div>
    </CardContent>
  );
};

export default PdfAnalysisTab;
