import { Link } from "react-router-dom";
import { Aperture } from "lucide-react";
export default function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="page-width flex flex-col items-start justify-between gap-4 py-7 pb-28 lg:pb-7 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <p className="flex items-center gap-2">
          <Aperture size={15} />A little imagination. A whole new room.
        </p>
        <div className="flex items-center gap-5">
          <Link to="/" className="hover:text-foreground">
            Design studio
          </Link>
          <Link to="/projects" className="hover:text-foreground">
            My projects
          </Link>
          <span>© {new Date().getFullYear()} Roomscape</span>
        </div>
      </div>
    </footer>
  );
}
