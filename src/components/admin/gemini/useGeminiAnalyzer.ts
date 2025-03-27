
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FurnitureItem } from '@/types/database';
import { AnalysisResult } from './types';

interface UseGeminiAnalyzerProps {
  onItemsExtracted: (items: Partial<FurnitureItem>[]) => void;
}

export const useGeminiAnalyzer = ({ onItemsExtracted }: UseGeminiAnalyzerProps) => {
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

  return {
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
  };
};
