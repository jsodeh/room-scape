
import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, FileText, Link as LinkIcon } from 'lucide-react';
import { FurnitureItem } from '@/types/database';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FURNITURE_CATEGORIES } from './ResourceFilters';

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
        setResourceTab(currentItem.resource_type);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSave} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="resource_type" className="block text-sm font-medium">Resource Type</label>
            <Tabs value={resourceTab} onValueChange={(value) => {
              setResourceTab(value as 'image' | 'pdf' | 'url');
              setCurrentItem(prev => ({...prev, resource_type: value as 'image' | 'pdf' | 'url'}));
            }}>
              <TabsList className="grid grid-cols-3 mb-2">
                <TabsTrigger value="image" className="flex items-center gap-1">
                  <Image className="h-4 w-4" />
                  <span>Image</span>
                </TabsTrigger>
                <TabsTrigger value="pdf" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>PDF</span>
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-1">
                  <LinkIcon className="h-4 w-4" />
                  <span>Web URL</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">Name</label>
            <Input
              id="name"
              name="name"
              value={currentItem.name || ''}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium">Category</label>
            <Select
              value={currentItem.category || ''}
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {FURNITURE_CATEGORIES.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">Description</label>
            <Textarea
              id="description"
              name="description"
              value={currentItem.description || ''}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          
          <TabsContent value="image" className="mt-0 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Upload Image</label>
              <ImageUpload
                onImagesSelected={handleImagesSelected}
                onImageUrlsReady={handleImageUrlsReady}
                maxFiles={1}
              />
              {currentItem.image_url && !imageFile && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-2">Current Image:</p>
                  <div className="h-28 w-28 rounded overflow-hidden border">
                    <img
                      src={currentItem.image_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="pdf" className="mt-0 space-y-4">
            <div className="space-y-2">
              <label htmlFor="pdf" className="block text-sm font-medium">Upload PDF Document</label>
              <Input
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={handlePdfChange}
              />
              {currentItem.pdf_url && !pdfFile && (
                <div className="mt-2 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <a 
                    href={currentItem.pdf_url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View current PDF
                  </a>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="mt-0 space-y-4">
            <div className="space-y-2">
              <label htmlFor="external_url" className="block text-sm font-medium">Website URL</label>
              <Input
                id="external_url"
                name="external_url"
                type="url"
                placeholder="https://example.com/furniture-item"
                value={currentItem.external_url || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="thumbnail" className="block text-sm font-medium">Thumbnail Image (Optional)</label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {currentItem.image_url && !imageFile && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-2">Current Thumbnail:</p>
                  <div className="h-28 w-28 rounded overflow-hidden border">
                    <img
                      src={currentItem.image_url}
                      alt="Thumbnail"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {isUploading && (
            <div className="w-full bg-muted rounded-full h-2.5 mt-2">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
          
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
