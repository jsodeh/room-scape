
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/image-upload/ImageUpload';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { uploadMultipleImages } from '@/services/storageService';
import { toast } from 'sonner';

interface CustomFurnitureUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  onCancel: () => void;
}

const CustomFurnitureUploader = ({ onImageUploaded, onCancel }: CustomFurnitureUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [name, setName] = useState('My Custom Furniture');
  const [description, setDescription] = useState('');

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select an image to upload");
      return;
    }

    setUploading(true);
    try {
      // We're only supporting one image at a time for custom furniture
      const urls = await uploadMultipleImages(selectedFiles, 'furniture-images');
      
      if (urls.length > 0) {
        toast.success('Custom furniture image uploaded successfully');
        onImageUploaded(urls[0]);
      } else {
        toast.error('Failed to upload furniture image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading furniture image');
    } finally {
      setUploading(false);
    }
  };

  const handleImagesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Upload Custom Furniture</h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="furniture-name">Name</Label>
          <Input 
            id="furniture-name"
            value={name}
            onChange={(e) => setName(e.target.value)} 
            placeholder="Furniture name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="furniture-description">Description (optional)</Label>
          <Textarea 
            id="furniture-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Describe this furniture piece"
            rows={2}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Furniture Image</Label>
          <ImageUpload 
            onImagesSelected={handleImagesSelected}
            maxFiles={1}
          />
          
          <p className="text-xs text-muted-foreground mt-2">
            For best results, use images with transparent backgrounds (PNG format)
          </p>
        </div>
      </div>
      
      <div className="flex gap-2 justify-end pt-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={uploading || selectedFiles.length === 0}
        >
          {uploading ? 'Uploading...' : 'Add Custom Furniture'}
        </Button>
      </div>
      
      <div className="text-xs text-amber-600 text-center pt-2">
        <span className="font-medium">Premium Feature:</span> Custom furniture uploads are available to premium users
      </div>
    </div>
  );
};

export default CustomFurnitureUploader;
