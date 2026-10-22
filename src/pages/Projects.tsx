import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  FolderOpen,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getUserStagingProjects } from "@/services/stagingService";
import { StagingProject } from "@/types/database";

export function ProjectStatus({
  status,
}: {
  status: StagingProject["status"];
}) {
  const labels = {
    completed: "Ready to view",
    processing: "Designing",
    pending: "In queue",
    failed: "Needs attention",
  };
  const colors = {
    completed: "bg-accent text-accent-foreground",
    processing: "bg-secondary text-foreground",
    pending: "bg-secondary text-muted-foreground",
    failed: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${colors[status]}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
export default function Projects() {
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const query = useQuery({
    queryKey: ["staging-projects", user?.id],
    queryFn: () => getUserStagingProjects(user!.id),
    enabled: !!user,
    staleTime: 15000,
    refetchInterval: (query) =>
      query.state.data?.some(
        (project) =>
          project.status === "processing" || project.status === "pending",
      )
        ? 5000
        : false,
  });
  const projects = query.data || [];
  const filtered = projects.filter(
    (project) =>
      (filter === "all" ||
        (filter === "active"
          ? ["pending", "processing"].includes(project.status)
          : project.status === filter)) &&
      `${project.title || ""} ${project.instructions || ""} ${project.id}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="page-width flex-1 py-10 sm:py-14">
        <div className="mb-9 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Your collection of possibilities</p>
            <h1 className="editorial-title text-4xl sm:text-5xl">
              Spaces, <span className="italic text-primary">reimagined.</span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Your rooms and ideas, all in one place.
            </p>
          </div>
          <Button asChild className="shrink-0 rounded-xl">
            <Link to="/">
              <Plus />
              <span className="hidden sm:inline">Design a room</span>
              <span className="sm:hidden">New room</span>
            </Link>
          </Button>
        </div>
        {authLoading || (user && query.isPending) ? (
          <div
            className="flex items-center justify-center gap-3 py-24 text-muted-foreground"
            role="status"
          >
            <Loader2 className="animate-spin" />
            Loading your spaces…
          </div>
        ) : !user ? (
          <div className="studio-panel mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center">
            <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <FolderOpen strokeWidth={1.2} size={30} />
            </span>
            <h2 className="editorial-title text-3xl">A home for your ideas.</h2>
            <p className="mb-7 mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Sign in to save your designs, revisit a favourite room and keep
              your next idea close.
            </p>
            <Button asChild>
              <Link to="/auth?next=/projects">
                Sign in to view projects
                <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : query.isError ? (
          <div role="alert" className="studio-panel p-8 text-center">
            <h2 className="text-lg font-medium">
              Your projects couldn't be loaded.
            </h2>
            <p className="my-3 text-sm text-muted-foreground">
              Please check your connection and try again.
            </p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-7 flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center">
              <div
                className="flex flex-wrap gap-1"
                aria-label="Filter projects"
              >
                {[
                  ["all", "All rooms"],
                  ["completed", "Completed"],
                  ["active", "In progress"],
                  ["failed", "Needs attention"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                    className={`rounded-lg px-3 py-2 text-xs ${filter === value ? "bg-secondary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {label}
                    {value === "all" && (
                      <span className="ml-2 text-muted-foreground">
                        {projects.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="relative sm:w-64">
                <Search
                  size={15}
                  className="absolute left-3 top-3 text-muted-foreground"
                />
                <input
                  type="search"
                  aria-label="Search projects"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find a room or idea…"
                  className="studio-input pl-9"
                />
              </div>
            </div>
            {filtered.length ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((project, i) => (
                  <Link
                    to={`/projects/${project.id}`}
                    key={project.id}
                    className="studio-panel group overflow-hidden transition-shadow hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                      {project.staged_images[0] ||
                      project.original_images[0] ? (
                        <img
                          src={
                            project.staged_images[0] ||
                            project.original_images[0]
                          }
                          alt={project.title || "Room design"}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImagePlus
                            className="text-muted-foreground"
                            size={32}
                          />
                        </div>
                      )}
                      <div className="absolute left-3 top-3">
                        <ProjectStatus status={project.status} />
                      </div>
                      <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/95">
                        <ArrowUpRight size={15} />
                      </span>
                    </div>
                    <div className="p-5">
                      <h2 className="mb-2 text-sm font-semibold">
                        {project.title || `Room design ${projects.length - i}`}
                      </h2>
                      <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {project.instructions ||
                          "A fresh perspective for your space."}
                      </p>
                      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock3 size={11} />
                        {new Date(project.created_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed py-20 text-center">
                <FolderOpen
                  className="mx-auto mb-4 text-primary"
                  strokeWidth={1.2}
                  size={34}
                />
                <h2 className="editorial-title text-3xl">
                  {projects.length
                    ? "No rooms found."
                    : "Every great space starts with an idea."}
                </h2>
                <p className="mb-6 mt-3 text-sm text-muted-foreground">
                  {projects.length
                    ? "Try a different search or filter."
                    : "Upload your first room and see the possibilities."}
                </p>
                {projects.length ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilter("all");
                      setSearch("");
                    }}
                  >
                    <X />
                    Clear filters
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/">
                      Design your first room
                      <ArrowRight />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
