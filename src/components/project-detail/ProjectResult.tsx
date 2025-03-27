
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { StagingProject } from '@/types/database';

interface ProjectResultProps {
  project: StagingProject;
}

const ProjectResult = ({ project }: ProjectResultProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleDownloadImage = (imageUrl: string) => {
    // Create a temporary anchor element to download the image
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `staged-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get current image based on selection and view mode
  const currentImage = showOriginal 
    ? project.original_images[selectedImageIndex] 
    : project.staged_images[selectedImageIndex];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staging Results</CardTitle>
        <CardDescription>
          View and download your virtual staging results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-md border">
              <AspectRatio ratio={4/3}>
                <img
                  src={currentImage}
                  alt={showOriginal ? "Original room" : "Staged result"}
                  className="h-full w-full object-cover"
                />
              </AspectRatio>
              
              {/* View toggle button */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <Button 
                  variant="secondary" 
                  className="bg-black/70 backdrop-blur-sm text-white border-0 hover:bg-black/80"
                  onClick={() => setShowOriginal(!showOriginal)}
                >
                  {showOriginal ? "View Staged" : "View Original"}
                </Button>
              </div>
              
              {/* Navigation arrows when multiple images */}
              {project.staged_images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10"
                    onClick={() => setSelectedImageIndex(prev => Math.max(0, prev - 1))}
                    disabled={selectedImageIndex === 0}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10"
                    onClick={() => setSelectedImageIndex(prev => Math.min(project.staged_images.length - 1, prev + 1))}
                    disabled={selectedImageIndex === project.staged_images.length - 1}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              
              {/* Image numbering */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-1.5 text-white text-sm font-medium">
                {showOriginal ? "Original" : "Staged"} Room {selectedImageIndex + 1} of {project.staged_images.length}
              </div>
            </div>
            
            {project.staged_images.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {project.staged_images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`overflow-hidden rounded-md border p-1 ${
                      selectedImageIndex === index ? 'border-primary' : 'border-muted'
                    }`}
                  >
                    <div className="h-16 w-16 overflow-hidden rounded">
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex justify-center">
              <Button 
                onClick={() => handleDownloadImage(currentImage)}
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Image
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-medium">Original Image</h3>
              <div className="overflow-hidden rounded-md border">
                <AspectRatio ratio={4/3}>
                  <img
                    src={project.original_images[0]}
                    alt="Original room"
                    className="h-full w-full object-cover"
                  />
                </AspectRatio>
              </div>
            </div>
            
            <div>
              <h3 className="mb-2 text-lg font-medium">Staging Instructions</h3>
              <p className="rounded-md bg-muted p-4 text-sm">
                {project.instructions || "No specific instructions provided."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectResult;
