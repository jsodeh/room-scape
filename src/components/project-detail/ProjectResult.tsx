import { useStagingContext } from "@/context/StagingContext";
import { useNavigate } from "react-router-dom";
import { StagingProject } from "@/types/database";
import ResultsDisplay from "@/components/ResultsDisplay";
export default function ProjectResult({
  project,
}: {
  project: StagingProject;
}) {
  const navigate = useNavigate();
  const { resetState } = useStagingContext();
  return (
    <div className="studio-panel space-y-6 p-4 sm:p-6">
      <ResultsDisplay
        originalImages={project.original_images}
        stagedImages={project.staged_images}
        onReset={() => {
          resetState();
          navigate("/");
        }}
      />
      <details className="border-t pt-5">
        <summary className="cursor-pointer text-sm font-medium">
          The design brief
        </summary>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {project.instructions || "No additional instructions."}
        </p>
      </details>
    </div>
  );
}
