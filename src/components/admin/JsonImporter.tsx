
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownToLine, FileJson, Loader2, Upload } from 'lucide-react';
import { parseProductJson } from '@/services/jsonImportService';
import { FurnitureItem } from '@/types/database';
import { importFurnitureItems } from '@/services/furnitureService';

interface JsonImporterProps {
  onItemsExtracted: (items: Partial<FurnitureItem>[]) => void;
}

const JsonImporter = ({ onItemsExtracted }: JsonImporterProps) => {
  const [jsonContent, setJsonContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBatchImporting, setIsBatchImporting] = useState(false);
  const [processedItems, setProcessedItems] = useState<Partial<FurnitureItem>[]>([]);
  const [importStats, setImportStats] = useState<{ total: number; valid: number } | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonContent(e.target.value);
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
        total: result.items.length,
        valid: validItems.length
      });
      
      setProcessedItems(validItems);
      
      // If there's at least one valid item, pass the first one to the dialog
      if (validItems.length > 0) {
        onItemsExtracted([validItems[0]]);
      }
      
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
    
    try {
      const success = await importFurnitureItems(processedItems);
      
      if (success) {
        toast.success(`Successfully imported ${processedItems.length} items`);
        // Clear the form after successful import
        setJsonContent('');
        setProcessedItems([]);
        setImportStats(null);
      }
    } catch (error: any) {
      toast.error(`Failed to import items: ${error.message}`);
    } finally {
      setIsBatchImporting(false);
    }
  };

  const clearContent = () => {
    setJsonContent('');
    setImportStats(null);
    setProcessedItems([]);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    try {
      // Try to parse and format the JSON for better readability
      const parsedJson = JSON.parse(pastedText);
      setJsonContent(JSON.stringify(parsedJson, null, 2));
      e.preventDefault(); // Prevent the default paste behavior
    } catch (error) {
      // If not valid JSON, let the default paste behavior happen
    }
  };

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
        setJsonContent(JSON.stringify(parsedJson, null, 2));
      } catch (error: any) {
        toast.error(`Error reading JSON file: ${error.message}`);
      }
    };
    reader.readAsText(file);
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
            <span className="text-sm text-muted-foreground">or paste JSON content below</span>
          </div>
        </div>
        
        <Textarea 
          value={jsonContent}
          onChange={handleTextChange}
          onPaste={handlePaste}
          placeholder="Paste your JSON content here..."
          className="font-mono text-sm min-h-[300px]"
        />
        
        {importStats && (
          <div className="text-sm space-y-2">
            <p>Processed {importStats.total} items, found {importStats.valid} valid items with images.</p>
            
            {processedItems.length > 0 && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleBatchImport}
                  disabled={isBatchImporting}
                  variant="secondary"
                  className="gap-2"
                >
                  {isBatchImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Import All {processedItems.length} Items
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
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
