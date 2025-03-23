
import { StagingProject, ProjectFeedback } from '@/types/database';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Star } from 'lucide-react';
import FeedbackForm from '@/components/profile/FeedbackForm';

interface ProjectFeedbackViewProps {
  project: StagingProject;
  feedback: ProjectFeedback | null;
}

const ProjectFeedbackView = ({ project, feedback }: ProjectFeedbackViewProps) => {
  return (
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
  );
};

export default ProjectFeedbackView;
