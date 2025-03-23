
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const ProjectNotFound = () => {
  const navigate = useNavigate();
  
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
};

export default ProjectNotFound;
