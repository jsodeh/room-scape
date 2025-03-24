import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FurnitureItem } from '@/types/database';
import ImageUpload from '@/components/ImageUpload';
import { UploadCloud, FileText, Images, RefreshCw } from 'lucide-react';

interface AnalysisResult {
  success: boolean;
  analysis: string;
  structuredData?: any;
  error?: string;
}

interface GeminiAnalyzerProps {
  onItemsExtracted: (items: Partial<FurnitureItem>[]) => void;
}

const GeminiAnalyzer: React.FC<GeminiAnalyzerProps> = ({ onItemsExtracted }) => {
  const [activeTab, setActiveTab] = useState<'image' | 'pdf' | 'compare'>('image');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [externalPdfUrl, setExternalPdfUrl] = useState('');
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

  const handleExternalPdfUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExternalPdfUrl(e.target.value);
  };

  const handleUsePdfUrl = () => {
    if (!externalPdfUrl) {
      toast.error('Please enter a valid PDF URL');
      return;
    }
    setPdfUrl(externalPdfUrl);
    toast.success('External PDF URL set for analysis');
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Product Image</Label>
              <ImageUpload
                maxFiles={1}
                onImagesSelected={() => {}}
                onImageUrlsReady={handleImageUrlsReady}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customPrompt">Custom Instructions (Optional)</Label>
              <Textarea
                id="customPrompt"
                placeholder="Add specific instructions for the AI analysis..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="resize-none h-20"
              />
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="pdf">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload PDF Document</Label>
              <ImageUpload
                maxFiles={1}
                onImagesSelected={() => {}}
                onImageUrlsReady={handlePdfUrlsReady}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="externalPdfUrl">Or Enter PDF URL</Label>
              <div className="flex gap-2">
                <Input
                  id="externalPdfUrl"
                  placeholder="https://example.com/document.pdf"
                  value={externalPdfUrl}
                  onChange={handleExternalPdfUrlChange}
                />
                <Button 
                  variant="outline" 
                  onClick={handleUsePdfUrl}
                  type="button"
                >
                  Use URL
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pdfPrompt">Custom Instructions (Optional)</Label>
              <Textarea
                id="pdfPrompt"
                placeholder="Add specific instructions for the AI analysis..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="resize-none h-20"
              />
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="compare">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Multiple Product Images to Compare</Label>
              <ImageUpload
                maxFiles={4}
                onImagesSelected={() => {}}
                onImageUrlsReady={handleImageUrlsReady}
              />
              <p className="text-xs text-muted-foreground">Upload 2-4 images to compare products</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comparePrompt">Custom Instructions (Optional)</Label>
              <Textarea
                id="comparePrompt"
                placeholder="Add specific instructions for the comparison..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="resize-none h-20"
              />
            </div>
          </CardContent>
        </TabsContent>
        
        {isAnalyzing && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Analyzing with Gemini AI...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        )}
        
        {analysisResult && (
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
                  
                  {activeTab === 'image' && (
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
