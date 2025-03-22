import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TabsWrapper, TabsContent, TabsList, TabsTrigger } from '@/components/TabsWrapper';
import { 
  ArrowRight, 
  Upload, 
  Sofa, 
  MessageSquare, 
  ImageIcon, 
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImageUpload from '@/components/ImageUpload';
import FurnitureSelector from '@/components/FurnitureSelector';
import StageInstructions from '@/components/StageInstructions';
import ResultsDisplay from '@/components/ResultsDisplay';
import { FurnitureItem } from '@/lib/supabase';

const Index = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem[]>([]);
  const [stagingInstructions, setStagingInstructions] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [originalImagePreviews, setOriginalImagePreviews] = useState<string[]>([]);
  const [stagedImageResults, setStagedImageResults] = useState<string[]>([]);

  const handleImagesSelected = (files: File[]) => {
    setUploadedImages(files);
    
    // Create preview URLs for original images
    const imagePreviews = files.map(file => URL.createObjectURL(file));
    setOriginalImagePreviews(imagePreviews);
  };

  const handleFurnitureSelected = (items: FurnitureItem[]) => {
    setSelectedFurniture(items);
  };

  const handleInstructionsChange = (instructions: string) => {
    setStagingInstructions(instructions);
  };

  const handleReferenceImageChange = (file: File | null) => {
    setReferenceImage(file);
  };

  const isStepComplete = (step: string) => {
    switch (step) {
      case 'upload':
        return uploadedImages.length > 0;
      case 'furniture':
        return selectedFurniture.length > 0;
      case 'instructions':
        return stagingInstructions.trim().length > 0;
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (activeTab === 'upload' && isStepComplete('upload')) {
      setActiveTab('furniture');
    } else if (activeTab === 'furniture' && isStepComplete('furniture')) {
      setActiveTab('instructions');
    }
  };

  const handleSubmit = async () => {
    if (!isStepComplete('upload') || !isStepComplete('furniture') || !isStepComplete('instructions')) {
      toast.error('Please complete all steps before submitting');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real application, we would send the images and data to a backend API
      // For this demonstration, we'll simulate a processing delay and use the original images as results
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock staged results - in a real app, these would come from the backend
      setStagedImageResults([...originalImagePreviews]);
      
      setIsComplete(true);
      toast.success('Staging complete! Check out your results.');
    } catch (error) {
      console.error('Error processing staging request:', error);
      toast.error('An error occurred while processing your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    // Clean up object URLs to prevent memory leaks
    originalImagePreviews.forEach(url => URL.revokeObjectURL(url));
    
    setUploadedImages([]);
    setSelectedFurniture([]);
    setStagingInstructions('');
    setReferenceImage(null);
    setIsProcessing(false);
    setIsComplete(false);
    setOriginalImagePreviews([]);
    setStagedImageResults([]);
    setActiveTab('upload');
    
    toast.info('Started a new staging project');
  };

  const handleRegenerate = () => {
    toast('This feature would regenerate the staging with different variations', {
      description: 'In a production app, this would send a request to regenerate the results'
    });
  };

  if (isComplete) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-20 px-4 container mx-auto">
          <div className="max-w-5xl mx-auto pt-12">
            <h1 className="text-3xl font-semibold text-center mb-8">Your Staged Room</h1>
            <ResultsDisplay 
              originalImages={originalImagePreviews}
              stagedImages={stagedImageResults}
              onRegenerate={handleRegenerate}
              onReset={handleReset}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 py-16 px-4 container mx-auto">
        <div className="max-w-3xl mx-auto pt-12">
          <div className="text-center mb-10 space-y-3">
            <h1 className="text-3xl font-semibold">Virtual Room Staging</h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Transform empty spaces into beautifully staged rooms in just a few steps.
              Upload photos, select furniture, and provide instructions to get started.
            </p>
          </div>
          
          <TabsWrapper value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger 
                value="upload" 
                className="data-[state=active]:shadow-sm relative"
              >
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload Images</span>
                  <span className="sm:hidden">Upload</span>
                </span>
                {isStepComplete('upload') && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="furniture" 
                className="data-[state=active]:shadow-sm relative"
                disabled={!isStepComplete('upload')}
              >
                <span className="flex items-center gap-2">
                  <Sofa className="h-4 w-4" />
                  <span className="hidden sm:inline">Select Furniture</span>
                  <span className="sm:hidden">Furniture</span>
                </span>
                {isStepComplete('furniture') && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="instructions" 
                className="data-[state=active]:shadow-sm relative"
                disabled={!isStepComplete('furniture')}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Instructions</span>
                  <span className="sm:hidden">Instructions</span>
                </span>
                {isStepComplete('instructions') && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
                )}
              </TabsTrigger>
            </TabsList>
            
            <div className="border rounded-lg p-6 bg-white shadow-sm">
              <TabsContent value="upload" className="mt-0">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-medium">Upload Room Images</h2>
                    <p className="text-sm text-muted-foreground">
                      Upload one or more images of the room you want to stage. We accept JPG and PNG formats.
                    </p>
                  </div>
                  
                  <ImageUpload onImagesSelected={handleImagesSelected} />
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={goToNextStep} 
                      disabled={!isStepComplete('upload')}
                      className="gap-2"
                    >
                      Next Step <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="furniture" className="mt-0">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-medium">Select Furniture</h2>
                    <p className="text-sm text-muted-foreground">
                      Choose furniture items to include in your virtual staging. Select multiple items from different categories.
                    </p>
                  </div>
                  
                  <FurnitureSelector onFurnitureSelected={handleFurnitureSelected} />
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={goToNextStep} 
                      disabled={!isStepComplete('furniture')}
                      className="gap-2"
                    >
                      Next Step <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="instructions" className="mt-0">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-medium">Staging Instructions</h2>
                    <p className="text-sm text-muted-foreground">
                      Provide specific instructions on how you'd like the room to be staged and optionally upload a reference image.
                    </p>
                  </div>
                  
                  <StageInstructions 
                    onInstructionsChange={handleInstructionsChange}
                    onReferenceImageChange={handleReferenceImageChange}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isProcessing || !isStepComplete('instructions')}
                      className="gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4" />
                          Generate Staged Room
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </TabsWrapper>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
