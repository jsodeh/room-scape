
import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { FurnitureItem } from '@/types/database';
import { toast } from 'sonner';

// Import our new components
import ResourceTypeSelector from './ResourceTypeSelector';
import ResourceBasicFields from './ResourceBasicFields';
import ImageResourceForm from './ImageResourceForm';
import PdfResourceForm from './PdfResourceForm';
import UrlResourceForm from './UrlResourceForm';
import ResourceUploadProgress from './ResourceUploadProgress';

interface ResourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: Partial<FurnitureItem>;
  setCurrentItem: React.Dispatch<React.SetStateAction<Partial<FurnitureItem>>>;
  isEditMode: boolean;
  onSave: (e: React.FormEvent) => void;
}

const ResourceDialog = ({
  isOpen,
  onClose,
  currentItem,
  setCurrentItem,
  isEditMode,
  onSave
}: ResourceDialogProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resourceTab, setResourceTab] = useState<'image' | 'pdf' | 'url'>('image');

  useEffect(() => {
    if (isOpen) {
      // Set the resource tab based on the current item's resource type
      if (currentItem.resource_type) {
        setResourceTab(currentItem.resource_type as 'image' | 'pdf' | 'url');
      }
    }
  }, [isOpen, currentItem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleImagesSelected = (files: File[]) => {
    if (files.length > 0) {
      setImageFile(files[0]);
    }
  };

  const handleImageUrlsReady = (urls: string[]) => {
    if (urls.length > 0) {
      setCurrentItem(prev => ({ ...prev, image_url: urls[0] }));
    }
  };

  const handleResourceTypeChange = (value: 'image' | 'pdf' | 'url') => {
    setResourceTab(value);
    setCurrentItem(prev => ({...prev, resource_type: value}));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSave} className="space-y-4">
          <ResourceTypeSelector 
            value={resourceTab} 
            onChange={handleResourceTypeChange} 
          />
          
          <ResourceBasicFields
            currentItem={currentItem}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
          />
          
          <TabsContent value="image" className="mt-0 space-y-4">
            <ImageResourceForm
              imageUrl={currentItem.image_url}
              onImagesSelected={handleImagesSelected}
              onImageUrlsReady={handleImageUrlsReady}
            />
          </TabsContent>
          
          <TabsContent value="pdf" className="mt-0 space-y-4">
            <PdfResourceForm
              pdfUrl={currentItem.pdf_url}
              onPdfChange={handlePdfChange}
            />
          </TabsContent>
          
          <TabsContent value="url" className="mt-0 space-y-4">
            <UrlResourceForm
              externalUrl={currentItem.external_url}
              imageUrl={currentItem.image_url}
              onInputChange={handleInputChange}
              onImageChange={handleImageChange}
            />
          </TabsContent>
          
          <ResourceUploadProgress 
            isUploading={isUploading} 
            uploadProgress={uploadProgress} 
          />
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isEditMode ? 'Update' : 'Add'} Resource
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceDialog;
