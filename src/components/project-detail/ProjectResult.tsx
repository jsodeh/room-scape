
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { StagingProject } from '@/types/database';

interface ProjectResultProps {
  project: StagingProject;
}

const ProjectResult = ({ project }: ProjectResultProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleDownloadImage = (imageUrl: string) => {
    // Create a temporary anchor element to download the image
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `staged-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            <div className="overflow-hidden rounded-md border">
              <AspectRatio ratio={4/3}>
                <img
                  src={project.staged_images[selectedImageIndex]}
                  alt="Staged result"
                  className="h-full w-full object-cover"
                />
              </AspectRatio>
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
                onClick={() => handleDownloadImage(project.staged_images[selectedImageIndex])}
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
