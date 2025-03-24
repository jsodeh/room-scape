
import { useState } from 'react';
import { toast } from 'sonner';
import { uploadMultipleImages } from '@/services/storageService';

interface UseImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  onImageUrlsReady?: (urls: string[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string;
}

export const useImageUploader = ({
  onImagesSelected,
  onImageUrlsReady,
  maxFiles = 10,
  acceptedFileTypes = "image/*"
}: UseImageUploaderProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const isFileTypeAccepted = (file: File): boolean => {
    // Check if we accept all files
    if (acceptedFileTypes === '*') return true;
    
    // Parse the accepted types
    const types = acceptedFileTypes.split(',').map(type => type.trim());
    
    // Check if file type matches any of the accepted types
    return types.some(type => {
      if (type.endsWith('/*')) {
        // Handle wildcards like 'image/*'
        const mainType = type.split('/')[0];
        return file.type.startsWith(`${mainType}/`);
      }
      return file.type === type;
    });
  };

  const handleFileSelect = (fileList: FileList) => {
    const files = Array.from(fileList);
    const validFiles = files.filter(isFileTypeAccepted);
    
    if (validFiles.length !== files.length) {
      toast.warning('Some files were not of the accepted type and were ignored');
    }
    
    if (validFiles.length === 0) {
      return;
    }
    
    if (selectedFiles.length + validFiles.length > maxFiles) {
      toast.warning(`You can upload a maximum of ${maxFiles} files.`);
      return;
    }
    
    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    onImagesSelected(newFiles);
    
    // Create preview URLs
    const newPreviews = validFiles.map(file => {
      if (file.type === 'application/pdf') {
        // For PDFs, we don't create a preview image from the file itself
        return URL.createObjectURL(new Blob(['pdf'])); // Just a placeholder
      }
      return URL.createObjectURL(file);
    });
    
    setPreviews(prev => [...prev, ...newPreviews]);
    
    toast.success(`${validFiles.length} file${validFiles.length === 1 ? '' : 's'} added`);
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
      toast.warning('No files selected for upload');
      return;
    }
    
    setUploading(true);
    
    try {
      const urls = await uploadMultipleImages(selectedFiles);
      
      if (urls.length > 0) {
        toast.success(`${urls.length} file${urls.length === 1 ? '' : 's'} uploaded successfully`);
        
        if (onImageUrlsReady) {
          onImageUrlsReady(urls);
        }
      } else {
        toast.error('Failed to upload files');
      }
    } catch (error) {
      toast.error('Error uploading files to storage');
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
