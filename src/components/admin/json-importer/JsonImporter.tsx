
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownToLine, FileJson, Loader2 } from 'lucide-react';
import { parseProductJson } from '@/services/jsonImportService';
import { FurnitureItem } from '@/types/database';
import { importFurnitureItems } from '@/services/furnitureService';
import FileUploader from './FileUploader';
import JsonEditor from './JsonEditor';
import ImportStats from './ImportStats';

interface JsonImporterProps {
  onItemsExtracted: (items: Partial<FurnitureItem>[]) => void;
}

const JsonImporter = ({ onItemsExtracted }: JsonImporterProps) => {
  const [jsonContent, setJsonContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBatchImporting, setIsBatchImporting] = useState(false);
  const [processedItems, setProcessedItems] = useState<Partial<FurnitureItem>[]>([]);
  const [importStats, setImportStats] = useState<{ 
    total: number; 
    valid: number;
    invalid?: number;
    reasons?: Record<string, number> 
  } | null>(null);

  const handleJsonContent = (content: string) => {
    setJsonContent(content);
    setImportStats(null);
    setProcessedItems([]);
  };

  const processJson = () => {
    try {
      setIsProcessing(true);
      
      const result = parseProductJson(jsonContent);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to parse JSON');
      }
      
      const validItems = result.items;
      
      setImportStats({
        total: result.stats?.total || validItems.length,
        valid: validItems.length,
        invalid: result.stats?.invalid,
        reasons: result.stats?.reasons
      });
      
      setProcessedItems(validItems);
      
      toast.success(`Successfully processed ${validItems.length} items from JSON`);
    } catch (error: any) {
      console.error('JSON import error:', error);
      toast.error(`Error processing JSON: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchImport = async () => {
    if (processedItems.length === 0) {
      toast.error('No items to import');
      return;
    }
    
    setIsBatchImporting(true);
    console.log(`Starting batch import of ${processedItems.length} items`);
    
    try {
      const success = await importFurnitureItems(processedItems);
      
      if (success) {
        toast.success(`Successfully imported ${processedItems.length} items`);
        // Clear the form after successful import
        setJsonContent('');
        setProcessedItems([]);
        setImportStats(null);
      } else {
        toast.error('Failed to import items. Please check the logs for more details.');
      }
    } catch (error: any) {
      toast.error(`Failed to import items: ${error.message}`);
      console.error('Batch import error:', error);
    } finally {
      setIsBatchImporting(false);
    }
  };

  const clearContent = () => {
    setJsonContent('');
    setImportStats(null);
    setProcessedItems([]);
  };

  // Add a function to handle viewing a single item
  const handleViewItem = (item: Partial<FurnitureItem>) => {
    onItemsExtracted([item]);
  };

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
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={clearContent}
          disabled={!jsonContent || isProcessing}
        >
          Clear
        </Button>
        <Button 
          onClick={processJson}
          disabled={!jsonContent || isProcessing}
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ArrowDownToLine className="h-4 w-4" />
              Process JSON
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JsonImporter;
