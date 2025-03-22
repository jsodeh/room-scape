
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStagingProject } from '@/services/stagingService';
import { getProjectFeedback } from '@/services/feedbackService';
import { StagingProject } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Download, Star, Calendar, Image as ImageIcon } from 'lucide-react';
import FeedbackForm from '@/components/profile/FeedbackForm';

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<StagingProject | null>(null);
  const [feedback, setFeedback] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      try {
        const projectData = await getStagingProject(projectId);
        setProject(projectData);
        
        if (projectData && projectData.status === 'completed') {
          const feedbackData = await getProjectFeedback(projectId);
          setFeedback(feedbackData);
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="mb-4 text-2xl font-bold">Project Not Found</h2>
            <p className="mb-6 text-muted-foreground">
              The project you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/profile')}>Back to Profile</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="container max-w-6xl py-8">
      <div className="mb-6 flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center" 
          onClick={() => navigate('/profile')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Profile
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div>
          <h1 className="text-2xl font-bold">
            {project.title || `Project ${project.id.slice(0, 8)}`}
          </h1>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(project.created_at).toLocaleDateString()}
            </span>
            <Badge variant="outline">
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      {project.status === 'completed' && project.staged_images.length > 0 ? (
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>
          
          <TabsContent value="results" className="mt-6">
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
          </TabsContent>
          
          <TabsContent value="feedback" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Feedback</CardTitle>
                <CardDescription>
                  Rate your staging results and provide feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedback ? (
                  <div className="space-y-4">
                    <div className="rounded-md bg-muted p-4">
                      <h3 className="mb-2 text-lg font-medium">Your Rating</h3>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= feedback.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium">{feedback.rating}/5</span>
                      </div>
                      
                      {feedback.comments && (
                        <div className="mt-4">
                          <h4 className="mb-1 text-sm font-medium">Your Comments:</h4>
                          <p className="text-sm text-muted-foreground">{feedback.comments}</p>
                        </div>
                      )}
                      
                      <p className="mt-4 text-xs text-muted-foreground">
                        Submitted on {new Date(feedback.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="rounded-md bg-green-50 p-4 text-green-700">
                      <p className="text-sm">
                        Thank you for your feedback! Your input helps us improve our staging services.
                      </p>
                    </div>
                  </div>
                ) : (
                  <FeedbackForm project={project} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-muted p-3">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-medium">
                {project.status === 'pending' && 'Project Pending'}
                {project.status === 'processing' && 'Project Processing'}
                {project.status === 'failed' && 'Project Failed'}
              </h2>
              <p className="mb-6 max-w-md text-muted-foreground">
                {project.status === 'pending' && 'Your project is waiting to be processed. This usually takes a few moments.'}
                {project.status === 'processing' && 'Your project is currently being processed. This may take a few minutes.'}
                {project.status === 'failed' && 'We encountered an issue while processing your project. Please try again.'}
              </p>
              <Button onClick={() => navigate('/')}>
                Create New Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectDetail;
