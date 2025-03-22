
import { useState } from 'react';
import { toast } from 'sonner';
import { uploadMultipleImages } from '@/services/storageService';

interface UseImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  onImageUrlsReady?: (urls: string[]) => void;
  maxFiles?: number;
}

export const useImageUploader = ({ 
  onImagesSelected, 
  onImageUrlsReady, 
  maxFiles = 10 
}: UseImageUploaderProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (fileList: FileList) => {
    const files = Array.from(fileList);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast.warning('Some files were not images and were ignored');
    }
    
    if (validFiles.length === 0) {
      return;
    }
    
    if (selectedFiles.length + validFiles.length > maxFiles) {
      toast.warning(`You can upload a maximum of ${maxFiles} images.`);
      return;
    }
    
    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    onImagesSelected(newFiles);
    
    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    
    toast.success(`${validFiles.length} image${validFiles.length === 1 ? '' : 's'} added`);
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    onImagesSelected(newFiles);
  };

  const handleUploadToStorage = async () => {
    if (selectedFiles.length === 0) {
      toast.warning('No images selected for upload');
      return;
    }
    
    setUploading(true);
    
    try {
      const urls = await uploadMultipleImages(selectedFiles);
      
      if (urls.length > 0) {
        toast.success(`${urls.length} image${urls.length === 1 ? '' : 's'} uploaded successfully`);
        
        if (onImageUrlsReady) {
          onImageUrlsReady(urls);
        }
      } else {
        toast.error('Failed to upload images');
      }
    } catch (error) {
      toast.error('Error uploading images to storage');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return {
    selectedFiles,
    previews,
    uploading,
    handleFileSelect,
    removeFile,
    handleUploadToStorage
  };
};
