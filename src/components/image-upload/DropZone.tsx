
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DropZoneProps {
  onFileSelect: (files: FileList) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  acceptedFileTypes?: string;
}

const DropZone = ({ onFileSelect, fileInputRef, acceptedFileTypes = "image/*" }: DropZoneProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileSelect(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    // Directly trigger the file input click here, nowhere else
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Determine the display text based on accepted file types
  const getFileTypeText = () => {
    if (acceptedFileTypes.includes('pdf')) {
      return acceptedFileTypes.includes('image') 
        ? 'Support for JPG, PNG, and PDF files' 
        : 'Support for PDF files';
    }
    return 'Support for JPG, PNG files';
  };

  return (
    <div
      className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <UploadCloud className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium">Drag files here</h3>
        <p className="text-sm text-muted-foreground mb-4">{getFileTypeText()}</p>
        <input
          type="file"
          multiple
          accept={acceptedFileTypes}
          className="hidden" // Hide the input entirely
          onChange={handleFileChange}
          ref={fileInputRef}
        />
        <Button className="relative" type="button">
          Choose files
        </Button>
      </div>
    </div>
  );
};

export default DropZone;
