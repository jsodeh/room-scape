
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FurnitureItem } from '@/types/database';
import ImageAnalysisTab from './ImageAnalysisTab';
import PdfAnalysisTab from './PdfAnalysisTab';
import CompareProductsTab from './CompareProductsTab';
import AnalysisProgress from './AnalysisProgress';
import AnalysisResults from './AnalysisResults';
import GeminiAnalyzerHeader from './GeminiAnalyzerHeader';
import TabsContainer from './TabsContainer';
import AnalysisFooter from './AnalysisFooter';
import { useGeminiAnalyzer } from './useGeminiAnalyzer';
import { TabsContent } from '@/components/ui/tabs';

interface GeminiAnalyzerProps {
  onItemsExtracted: (items: Partial<FurnitureItem>[]) => void;
}

const GeminiAnalyzer: React.FC<GeminiAnalyzerProps> = ({ onItemsExtracted }) => {
  const {
    activeTab,
    setActiveTab,
    imageUrls,
    pdfUrl,
    customPrompt,
    setCustomPrompt,
    isAnalyzing,
    progress,
    analysisResult,
    handleImageUrlsReady,
    handlePdfUrlsReady,
    resetAnalysis,
    extractFurnitureItem,
    handleAnalyze
  } = useGeminiAnalyzer({ onItemsExtracted });

  return (
    <Card className="shadow-md">
      <GeminiAnalyzerHeader />
      
      <TabsContainer 
        activeTab={activeTab} 
        onTabChange={(value) => setActiveTab(value as 'image' | 'pdf' | 'compare')}
      >
        <TabsContent value="image">
          <ImageAnalysisTab
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            onImageUrlsReady={handleImageUrlsReady}
          />
        </TabsContent>
        
        <TabsContent value="pdf">
          <PdfAnalysisTab
            pdfUrl={pdfUrl}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            onPdfUrlsReady={handlePdfUrlsReady}
          />
        </TabsContent>
        
        <TabsContent value="compare">
          <CompareProductsTab
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            onImageUrlsReady={handleImageUrlsReady}
          />
        </TabsContent>
        
        {isAnalyzing && (
          <CardContent>
            <AnalysisProgress progress={progress} />
          </CardContent>
        )}
        
        {analysisResult && (
          <AnalysisResults
            analysisResult={analysisResult}
            resetAnalysis={resetAnalysis}
            extractFurnitureItem={activeTab === 'image' ? extractFurnitureItem : undefined}
          />
        )}
        
        <AnalysisFooter 
          onAnalyze={handleAnalyze} 
          isAnalyzing={isAnalyzing} 
        />
      </TabsContainer>
    </Card>
  );
};

export default GeminiAnalyzer;
