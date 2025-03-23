
import React from 'react';
import { Input } from '@/components/ui/input';
import { FileText } from 'lucide-react';

interface PdfResourceFormProps {
  pdfUrl: string | undefined;
  onPdfChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PdfResourceForm = ({ pdfUrl, onPdfChange }: PdfResourceFormProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="pdf" className="block text-sm font-medium">Upload PDF Document</label>
      <Input
        id="pdf"
        type="file"
        accept=".pdf"
        onChange={onPdfChange}
      />
      {pdfUrl && (
        <div className="mt-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <a 
            href={pdfUrl} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline"
          >
            View current PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default PdfResourceForm;
