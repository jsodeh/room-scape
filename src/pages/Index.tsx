
import { useState, useEffect } from 'react';
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
import { FurnitureItem, createStagingProject, generateStagedImages, getStagingProject } from '@/services/storageService';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem[]>([]);
  const [stagingInstructions, setStagingInstructions] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [originalImagePreviews, setOriginalImagePreviews] = useState<string[]>([]);
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([]);
  const [stagedImageResults, setStagedImageResults] = useState<string[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  const handleImagesSelected = (files: File[]) => {
    setUploadedImages(files);
    
    // Create preview URLs for original images
    const imagePreviews = files.map(file => URL.createObjectURL(file));
    setOriginalImagePreviews(imagePreviews);
  };

  const handleImageUrlsReady = (urls: string[]) => {
    setOriginalImageUrls(urls);
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
        return uploadedImages.length > 0 && originalImageUrls.length > 0;
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

  // Poll for project status updates
  useEffect(() => {
    if (currentProjectId && isProcessing) {
      const interval = window.setInterval(async () => {
        try {
          const project = await getStagingProject(currentProjectId);
          
          if (project) {
            if (project.status === 'completed') {
              setStagedImageResults(project.staged_images);
              setIsProcessing(false);
              setIsComplete(true);
              clearInterval(interval);
              toast.success('Staging complete! Check out your results.');
            } else if (project.status === 'failed') {
              setIsProcessing(false);
              clearInterval(interval);
              toast.error('Staging failed. Please try again.');
            }
          }
        } catch (error) {
          console.error('Error polling project status:', error);
        }
      }, 5000); // Poll every 5 seconds
      
      setPollingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [currentProjectId, isProcessing]);

  const handleSubmit = async () => {
    if (!isStepComplete('upload') || !isStepComplete('furniture') || !isStepComplete('instructions') || !user) {
      toast.error('Please complete all steps before submitting');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create a new staging project
      const furnitureIds = selectedFurniture.map(item => item.id);
      
      const project = await createStagingProject(
        user.id,
        stagingInstructions,
        furnitureIds,
        originalImageUrls
      );
      
      if (!project) {
        throw new Error('Failed to create staging project');
      }
      
      setCurrentProjectId(project.id);
      
      // Start the image generation process
      const furnitureUrls = selectedFurniture.map(item => item.image_url);
      
      await generateStagedImages(
        project.id,
        originalImageUrls[0], // Use the first image as the main room image
        furnitureUrls,
        stagingInstructions
      );
      
      toast.info('Staging request submitted. This may take a few minutes.');
    } catch (error) {
      console.error('Error processing staging request:', error);
      setIsProcessing(false);
      toast.error('An error occurred while processing your request. Please try again.');
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
    setOriginalImageUrls([]);
    setStagedImageResults([]);
    setActiveTab('upload');
    setCurrentProjectId(null);
    
    // Clear any polling interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    toast.info('Started a new staging project');
  };

  const handleRegenerate = async () => {
    if (!currentProjectId || !user) {
      toast.error('Cannot regenerate without an active project');
      return;
    }
    
    setIsProcessing(true);
    setIsComplete(false);
    
    try {
      const furnitureUrls = selectedFurniture.map(item => item.image_url);
      
      await generateStagedImages(
        currentProjectId,
        originalImageUrls[0],
        furnitureUrls,
        stagingInstructions
      );
      
      toast.info('Regenerating staged room. This may take a few minutes.');
    } catch (error) {
      console.error('Error regenerating staged room:', error);
      setIsProcessing(false);
      toast.error('An error occurred while regenerating. Please try again.');
    }
  };

  if (isComplete) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-20 px-4 container mx-auto">
          <div className="max-w-5xl mx-auto pt-12">
            <h1 className="text-3xl font-semibold text-center mb-8">Your Staged Room</h1>
            <ResultsDisplay 
              originalImages={originalImageUrls}
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
                  
                  <ImageUpload 
                    onImagesSelected={handleImagesSelected} 
                    onImageUrlsReady={handleImageUrlsReady}
                  />
                  
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
