
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getStagingProject } from '@/services/stagingService';
import { getProjectFeedback } from '@/services/feedbackService';
import { StagingProject, ProjectFeedback } from '@/types/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectHeader from '@/components/project-detail/ProjectHeader';
import ProjectResult from '@/components/project-detail/ProjectResult';
import ProjectFeedbackView from '@/components/project-detail/ProjectFeedbackView';
import ProjectLoading from '@/components/project-detail/ProjectLoading';
import ProjectNotFound from '@/components/project-detail/ProjectNotFound';
import ProjectPending from '@/components/project-detail/ProjectPending';

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<StagingProject | null>(null);
  const [feedback, setFeedback] = useState<ProjectFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    return <ProjectLoading />;
  }

  if (!project) {
    return <ProjectNotFound />;
  }

  return (
    <div className="container max-w-6xl py-8">
      <ProjectHeader project={project} />

      {project.status === 'completed' && project.staged_images.length > 0 ? (
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>
          
          <TabsContent value="results" className="mt-6">
            <ProjectResult project={project} />
          </TabsContent>
          
          <TabsContent value="feedback" className="mt-6">
            <ProjectFeedbackView project={project} feedback={feedback} />
          </TabsContent>
        </Tabs>
      ) : (
        <ProjectPending project={project} />
      )}
    </div>
  );
};

export default ProjectDetail;
