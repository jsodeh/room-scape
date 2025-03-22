
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { StagingProject } from '@/types/database';
import { 
  Calendar, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RotateCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface ProjectsListProps {
  projects: StagingProject[];
}

const ProjectsList = ({ projects }: ProjectsListProps) => {
  const navigate = useNavigate();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-xl font-semibold">No projects yet</h3>
        <p className="mb-6 text-muted-foreground">
          You haven't created any staging projects yet. Start by creating your first one!
        </p>
        <Button onClick={() => navigate('/')}>Create New Project</Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Processing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Failed</Badge>;
      default:
        return null;
    }
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      {projects.map((project) => (
        <AccordionItem key={project.id} value={project.id}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex w-full items-center justify-between text-left">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {project.title || `Project ${project.id.slice(0, 8)}`}
                  </span>
                  {getStatusBadge(project.status)}
                </div>
                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    {project.original_images.length} original image(s)
                  </span>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 py-2">
              {project.status === 'completed' && project.staged_images.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {project.staged_images.slice(0, 2).map((image, index) => (
                    <div key={index} className="overflow-hidden rounded-md border">
                      <AspectRatio ratio={4/3}>
                        <img
                          src={image}
                          alt={`Staged result ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </AspectRatio>
                    </div>
                  ))}
                </div>
              )}
              
              {project.instructions && (
                <div>
                  <h4 className="mb-1 text-sm font-medium">Instructions:</h4>
                  <p className="text-sm text-muted-foreground">{project.instructions}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                {project.status === 'completed' && (
                  <Button onClick={() => handleViewProject(project.id)}>
                    View Results
                  </Button>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default ProjectsList;
