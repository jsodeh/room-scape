
import { useState, useRef } from 'react';
import { UploadCloud, X, Image, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
}

const ImageUpload = ({ onImagesSelected }: ImageUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (validFiles.length !== files.length) {
        toast.warning('Some files were not images and were ignored');
      }
      
      if (validFiles.length === 0) {
        return;
      }
      
      setSelectedFiles(prev => [...prev, ...validFiles]);
      onImagesSelected([...selectedFiles, ...validFiles]);
      
      // Create preview URLs
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
      
      toast.success(`${validFiles.length} image${validFiles.length === 1 ? '' : 's'} uploaded`);
    }
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (validFiles.length !== files.length) {
        toast.warning('Some files were not images and were ignored');
      }
      
      if (validFiles.length === 0) {
        return;
      }
      
      setSelectedFiles(prev => [...prev, ...validFiles]);
      onImagesSelected([...selectedFiles, ...validFiles]);
      
      // Create preview URLs
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
      
      toast.success(`${validFiles.length} image${validFiles.length === 1 ? '' : 's'} uploaded`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <UploadCloud className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium">Drag photos here</h3>
          <p className="text-sm text-muted-foreground mb-4">Support for JPG, PNG files</p>
          <Button className="relative" type="button">
            Choose photos
            <input
              type="file"
              multiple
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </Button>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Uploaded Images</h3>
            <div className="flex items-center text-sm text-gray-500 gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span>{selectedFiles.length} image{selectedFiles.length === 1 ? '' : 's'}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div 
                key={preview} 
                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                <img
                  src={preview}
                  alt={`Preview ${index}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <div
              className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center p-4">
                <Image className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Add more</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
