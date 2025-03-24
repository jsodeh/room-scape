
import { useState } from 'react';
import { toast } from 'sonner';
import { FurnitureItem } from '@/types/database';
import { parseProductJson } from '@/services/jsonImportService';
import { importFurnitureItems } from '@/services/furnitureService';

export interface JsonImportStats {
  total: number;
  valid: number;
  invalid?: number;
  reasons?: Record<string, number>;
}

export const useJsonImporter = (onItemsExtracted?: (items: Partial<FurnitureItem>[]) => void) => {
  const [jsonContent, setJsonContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBatchImporting, setIsBatchImporting] = useState(false);
  const [processedItems, setProcessedItems] = useState<Partial<FurnitureItem>[]>([]);
  const [importStats, setImportStats] = useState<JsonImportStats | null>(null);

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

  const handleViewItem = (item: Partial<FurnitureItem>) => {
    if (onItemsExtracted) {
      onItemsExtracted([item]);
    }
  };

  return {
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
  };
};
