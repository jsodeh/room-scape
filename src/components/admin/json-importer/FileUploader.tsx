
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFileContent: (content: string) => void;
}

const FileUploader = ({ onFileContent }: FileUploaderProps) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast.error('Please upload a JSON file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        // Format the JSON for better readability
        const parsedJson = JSON.parse(content);
        onFileContent(JSON.stringify(parsedJson, null, 2));
      } catch (error: any) {
        toast.error(`Error reading JSON file: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <Button 
        variant="outline" 
        className="gap-2"
        onClick={() => document.getElementById('json-file-input')?.click()}
      >
        <Upload className="h-4 w-4" />
        Upload JSON File
      </Button>
      <input 
        type="file" 
        id="json-file-input" 
        accept=".json,application/json" 
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default FileUploader;
