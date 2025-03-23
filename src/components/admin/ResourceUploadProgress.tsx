
import React from 'react';

interface ResourceUploadProgressProps {
  isUploading: boolean;
  uploadProgress: number;
}

const ResourceUploadProgress = ({ isUploading, uploadProgress }: ResourceUploadProgressProps) => {
  if (!isUploading) return null;

  return (
    <div className="w-full bg-muted rounded-full h-2.5 mt-2">
      <div 
        className="bg-primary h-2.5 rounded-full transition-all duration-300" 
        style={{ width: `${uploadProgress}%` }}
      ></div>
    </div>
  );
};

export default ResourceUploadProgress;
