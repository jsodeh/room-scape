
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileJson } from 'lucide-react';
import { FurnitureItem } from '@/types/database';
import FileUploader from './FileUploader';
import JsonEditor from './JsonEditor';
import ImportStats from './ImportStats';
import JsonActionButtons from './JsonActionButtons';
import { useJsonImporter } from '@/hooks/useJsonImporter';

interface JsonImporterProps {
  onItemsExtracted: (items: Partial<FurnitureItem>[]) => void;
}

const JsonImporter = ({ onItemsExtracted }: JsonImporterProps) => {
  const {
    jsonContent,
    isProcessing,
    isBatchImporting,
    processedItems,
    importStats,
    handleJsonContent,
    processJson,
    handleBatchImport,
    clearContent,
    handleViewItem
  } = useJsonImporter(onItemsExtracted);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          JSON Product Importer
        </CardTitle>
        <CardDescription>
          Paste JSON content containing product data to bulk import furniture items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FileUploader onFileContent={handleJsonContent} />
            <span className="text-sm text-muted-foreground">or paste JSON content below</span>
          </div>
        </div>
        
        <JsonEditor value={jsonContent} onChange={handleJsonContent} />
        
        <ImportStats 
          stats={importStats}
          processedItems={processedItems}
          isBatchImporting={isBatchImporting}
          onBatchImport={handleBatchImport}
          onViewItem={handleViewItem}
        />
      </CardContent>
      <CardFooter>
        <JsonActionButtons 
          isProcessing={isProcessing}
          hasContent={!!jsonContent}
          onClear={clearContent}
          onProcess={processJson}
        />
      </CardFooter>
    </Card>
  );
};

export default JsonImporter;
