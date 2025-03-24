import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FurnitureItem } from '@/types/database';
import { UploadCloud, FileText, Images } from 'lucide-react';
import ImageAnalysisTab from './ImageAnalysisTab';
import PdfAnalysisTab from './PdfAnalysisTab';
import CompareProductsTab from './CompareProductsTab';
import AnalysisResults from './AnalysisResults';
import AnalysisProgress from './AnalysisProgress';
import { AnalysisResult } from './types';

interface GeminiAnalyzerProps {
  onItemsExtracted: (items: Partial<FurnitureItem>[]) => void;
}

const GeminiAnalyzer: React.FC<GeminiAnalyzerProps> = ({ onItemsExtracted }) => {
  const [activeTab, setActiveTab] = useState<'image' | 'pdf' | 'compare'>('image');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleImageUrlsReady = (urls: string[]) => {
    setImageUrls(urls);
    toast.success(`${urls.length} image(s) ready for analysis`);
  };

  const handlePdfUrlsReady = (urls: string[]) => {
    if (urls.length > 0) {
      setPdfUrl(urls[0]);
      toast.success('PDF ready for analysis');
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setProgress(0);
  };

  const extractFurnitureItem = () => {
    if (!analysisResult || !analysisResult.success) {
      toast.error('No valid analysis result to extract');
      return;
    }

    try {
      const data = analysisResult.structuredData || {};
      const analysisText = analysisResult.analysis;
      
      const furnitureItem: Partial<FurnitureItem> = {
        name: data.name || data.product_name || extractField(analysisText, ['name', 'product name', 'item name'], 'New Product'),
        category: data.category || extractField(analysisText, ['category', 'type', 'product type'], 'decor'),
        description: data.description || extractField(analysisText, ['description', 'about', 'details'], 
          'Product extracted from Gemini AI analysis'),
        image_url: imageUrls.length > 0 ? imageUrls[0] : '',
        resource_type: 'image'
      };
      
      onItemsExtracted([furnitureItem]);
      toast.success('Product data extracted and ready to add');
    } catch (error) {
      console.error('Error extracting product data:', error);
      toast.error('Failed to extract product data');
    }
  };

  const extractField = (text: string, possibleLabels: string[], defaultValue: string = ''): string => {
    for (const label of possibleLabels) {
      const regex = new RegExp(`${label}[\\s]*[:-]\\s*([^\\n]+)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return defaultValue;
  };

  const handleAnalyze = async () => {
    if (activeTab === 'image' && imageUrls.length === 0) {
      toast.error('Please upload at least one image for analysis');
      return;
    }

    if (activeTab === 'pdf' && !pdfUrl) {
      toast.error('Please provide a PDF URL for analysis');
      return;
    }

    if (activeTab === 'compare' && imageUrls.length < 2) {
      toast.error('Please upload at least two images for comparison');
      return;
    }

    setIsAnalyzing(true);
    setProgress(10);
    setAnalysisResult(null);

    try {
      setProgress(30);
      
      const response = await supabase.functions.invoke('gemini-analyzer', {
        body: {
          imageUrls: activeTab === 'image' || activeTab === 'compare' ? imageUrls : undefined,
          pdfUrl: activeTab === 'pdf' ? pdfUrl : undefined,
          prompt: customPrompt || undefined,
          mode: activeTab
        }
      });
      
      setProgress(90);
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to analyze with Gemini');
      }
      
      setAnalysisResult(response.data);
      
      if (response.data.success) {
        toast.success('Analysis completed successfully');
      } else {
        toast.error(response.data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      toast.error(`Analysis failed: ${error.message}`);
      setAnalysisResult({
        success: false,
        analysis: '',
        error: error.message
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(100);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Gemini AI Analyzer</CardTitle>
        <CardDescription>
          Analyze product images, PDFs, or compare multiple products using Google's Gemini AI
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'image' | 'pdf' | 'compare')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="image" className="flex items-center gap-2">
            <UploadCloud className="h-4 w-4" />
            <span>Image Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="pdf" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>PDF Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <Images className="h-4 w-4" />
            <span>Compare Products</span>
          </TabsTrigger>
        </TabsList>
        
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
        
        <CardFooter className="pt-4">
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze with Gemini AI'}
          </Button>
        </CardFooter>
      </Tabs>
    </Card>
  );
};

export default GeminiAnalyzer;
