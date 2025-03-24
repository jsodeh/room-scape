
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { AnalysisResultsProps } from './types';

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ 
  analysisResult, 
  resetAnalysis, 
  extractFurnitureItem 
}) => {
  return (
    <CardContent className="border-t pt-4 mt-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Analysis Results</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetAnalysis}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>
        
        {analysisResult.success ? (
          <>
            <div className="border rounded-md p-4 bg-muted/50 whitespace-pre-wrap max-h-72 overflow-y-auto">
              {analysisResult.analysis}
            </div>
            
            {extractFurnitureItem && (
              <Button onClick={extractFurnitureItem}>
                Extract as Furniture Item
              </Button>
            )}
          </>
        ) : (
          <div className="border rounded-md p-4 bg-destructive/10 text-destructive">
            Error: {analysisResult.error || 'Unknown error occurred'}
          </div>
        )}
      </div>
    </CardContent>
  );
};

export default AnalysisResults;
