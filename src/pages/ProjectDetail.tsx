import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getStagingProject } from "@/services/stagingService";
import { getProjectFeedback } from "@/services/feedbackService";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectResult from "@/components/project-detail/ProjectResult";
import ProjectFeedbackView from "@/components/project-detail/ProjectFeedbackView";
import ProjectPending from "@/components/project-detail/ProjectPending";
import { ProjectStatus } from "./Projects";
export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading } = useAuth();
  const query = useQuery({
    queryKey: ["staging-project", user?.id, projectId],
    queryFn: () => getStagingProject(projectId!),
    enabled: !!user && !!projectId,
    refetchInterval: (query) =>
      ["pending", "processing"].includes(query.state.data?.status)
        ? 5000
        : false,
  });
  const project = query.data;
  const feedback = useQuery({
    queryKey: ["project-feedback", user?.id, projectId],
    queryFn: () => getProjectFeedback(projectId!),
    enabled: !!user && project?.status === "completed",
  });
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        id="main-content"
        className="page-width max-w-5xl flex-1 py-8 sm:py-12"
      >
        <Link
          to="/projects"
          className="mb-8 inline-flex items-center gap-2 rounded text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to projects
        </Link>
        {loading || (user && query.isPending) ? (
          <div
            className="flex items-center justify-center gap-3 py-24 text-muted-foreground"
            role="status"
          >
            <Loader2 className="animate-spin" />
            Loading your room…
          </div>
        ) : !user ? (
          <div className="studio-panel p-10 text-center">
            <h1 className="editorial-title text-3xl">
              Sign in to view this room.
            </h1>
            <p className="my-4 text-sm text-muted-foreground">
              Your projects are connected to your account.
            </p>
            <Button asChild>
              <Link
                to={`/auth?next=${encodeURIComponent(`/projects/${projectId}`)}`}
              >
                Sign in
              </Link>
            </Button>
          </div>
        ) : query.isError ? (
          <div role="alert" className="studio-panel p-10 text-center">
            <h1 className="text-lg">This room couldn't be loaded.</h1>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void query.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : !project ? (
          <div className="studio-panel p-10 text-center">
            <h1 className="editorial-title text-3xl">
              We couldn't find this room.
            </h1>
            <p className="my-4 text-sm text-muted-foreground">
              It may have been removed or belong to another account.
            </p>
            <Button asChild>
              <Link to="/projects">Back to your projects</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-3">Your room, reimagined</p>
                <h1 className="editorial-title text-4xl">
                  {project.title || "A new perspective."}
                </h1>
                <p className="mt-3 text-xs text-muted-foreground">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ProjectStatus status={project.status} />
                {import.meta.env.VITE_WORKSPACE_V2 === "true" && (
                  <Button asChild>
                    <Link to={`/?project=${project.id}`}>Continue editing</Link>
                  </Button>
                )}
              </div>
            </div>
            {project.status === "completed" && project.staged_images.length ? (
              <Tabs defaultValue="results">
                <TabsList className="mb-5">
                  <TabsTrigger value="results">Your design</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                </TabsList>
                <TabsContent value="results">
                  <ProjectResult project={project} />
                </TabsContent>
                <TabsContent value="feedback">
                  <ProjectFeedbackView
                    project={project}
                    feedback={feedback.data || null}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <ProjectPending project={project} />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
