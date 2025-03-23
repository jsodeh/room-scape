
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Calendar } from 'lucide-react';
import { StagingProject } from '@/types/database';

interface ProjectHeaderProps {
  project: StagingProject;
}

const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  const navigate = useNavigate();

  return (
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
  );
};

export default ProjectHeader;
