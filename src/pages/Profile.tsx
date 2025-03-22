
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfileForm from '@/components/profile/ProfileForm';
import ProjectsList from '@/components/projects/ProjectsList';
import { getUserStagingProjects } from '@/services/stagingService';
import { StagingProject } from '@/types/database';
import { Loader2 } from 'lucide-react';
import FeedbackForm from '@/components/profile/FeedbackForm';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<StagingProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          const userProjects = await getUserStagingProjects(user.id);
          setProjects(userProjects);
        } catch (error) {
          console.error('Error fetching user projects:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProjects();
  }, [user]);

  if (!user) {
    return null;
  }

  const userInitials = user.email ? user.email.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8 flex flex-col items-center space-y-4 md:flex-row md:space-y-0 md:space-x-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            {user.user_metadata?.full_name || user.email}
          </h1>
          <p className="text-muted-foreground">{user.email}</p>
          <p className="text-sm text-muted-foreground">Member since {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="settings">Profile Settings</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Staging Projects</CardTitle>
              <CardDescription>
                View and manage all your virtual staging projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ProjectsList projects={projects} />
              )}
              
              <div className="mt-6 flex justify-center">
                <Button onClick={() => navigate('/')}>
                  Create New Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your profile information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="feedback" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Feedback & Reviews</CardTitle>
              <CardDescription>
                Rate your completed projects and provide feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-4">
                  {projects
                    .filter(project => project.status === 'completed')
                    .map(project => (
                      <div key={project.id}>
                        <FeedbackForm project={project} />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  You don't have any completed projects to review yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
