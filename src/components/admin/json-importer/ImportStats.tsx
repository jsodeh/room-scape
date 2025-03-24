
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle, Eye } from 'lucide-react';
import { FurnitureItem } from '@/types/database';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportStatsProps {
  stats: { 
    total: number; 
    valid: number;
    invalid?: number;
    reasons?: Record<string, number> 
  } | null;
  processedItems: Partial<FurnitureItem>[];
  isBatchImporting: boolean;
  onBatchImport: () => void;
  onViewItem?: (item: Partial<FurnitureItem>) => void;
}

const ImportStats = ({ 
  stats, 
  processedItems, 
  isBatchImporting, 
  onBatchImport,
  onViewItem
}: ImportStatsProps) => {
  if (!stats) return null;

  const hasValidationErrors = stats.invalid && stats.invalid > 0;
  
  // Format reason messages for better readability
  const formatReason = (reason: string): string => {
    const reasonMap: Record<string, string> = {
      missing_name: 'Missing product name',
      missing_image: 'Missing product image',
      invalid_image_url: 'Invalid image URL',
      missing_category: 'Missing product category'
    };
    
    return reasonMap[reason] || reason;
  };

  // Get the first valid item for quick view, if available
  const hasViewableItems = processedItems.length > 0 && onViewItem;

  return (
    <div className="space-y-3">
      <div className="text-sm">
        <p>
          Processed {stats.total} items, found {stats.valid} valid items 
          {hasValidationErrors && ` (${stats.invalid} invalid)`}.
        </p>
      </div>
      
      {hasValidationErrors && stats.reasons && Object.keys(stats.reasons).length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <p className="font-medium">Validation errors:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {Object.entries(stats.reasons).map(([reason, count]) => (
                <li key={reason}>
                  {formatReason(reason)}: {count} item{count !== 1 ? 's' : ''}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {processedItems.length > 0 && (
        <div className="flex justify-end gap-2">
          {hasViewableItems && (
            <Button 
              onClick={() => onViewItem(processedItems[0])}
              variant="outline" 
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View First Item
            </Button>
          )}
          <Button 
            onClick={onBatchImport}
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
                <Download className="h-4 w-4" />
                Import All {processedItems.length} Items
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImportStats;
