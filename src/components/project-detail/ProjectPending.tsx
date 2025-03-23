
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StagingProject } from '@/types/database';

interface ProjectPendingProps {
  project: StagingProject;
}

const ProjectPending = ({ project }: ProjectPendingProps) => {
  const navigate = useNavigate();
  
  return (
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
  );
};

export default ProjectPending;
