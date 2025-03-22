
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Star, Calendar } from 'lucide-react';
import { StagingProject } from '@/types/database';
import { submitProjectFeedback } from '@/services/feedbackService';

interface FeedbackFormProps {
  project: StagingProject;
}

const FeedbackForm = ({ project }: FeedbackFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await submitProjectFeedback(project.id, {
        rating,
        comments: feedback
      });
      
      setIsSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {project.title || `Project from ${new Date(project.created_at).toLocaleDateString()}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {project.staged_images.length > 0 && (
            <div className="overflow-hidden rounded-md border">
              <AspectRatio ratio={4/3}>
                <img
                  src={project.staged_images[0]}
                  alt="Staged result"
                  className="h-full w-full object-cover"
                />
              </AspectRatio>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Completed on {new Date(project.updated_at).toLocaleDateString()}</span>
            </div>
            
            {isSubmitted ? (
              <div className="mt-4 rounded-md bg-green-50 p-4 text-green-700">
                <p className="font-medium">Feedback submitted</p>
                <p className="text-sm">Thank you for your feedback!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Rate this staging:</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="rounded-md p-1 focus:outline-none"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="feedback" className="mb-2 block text-sm font-medium">
                    Comments (optional):
                  </label>
                  <Textarea
                    id="feedback"
                    placeholder="Share your thoughts about the staging results..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <Button type="submit" disabled={isSubmitting || rating === 0}>
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
