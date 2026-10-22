import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  FolderOpen,
  LogOut,
  Moon,
  PanelsTopLeft,
  Sun,
  User,
  Aperture,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-xl">
      <div className="page-width flex h-[76px] items-center justify-between gap-3">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Roomscape home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Aperture size={22} strokeWidth={1.5} />
          </span>
          <span className="text-[22px] font-semibold tracking-[-.055em]">
            roomscape<span className="text-primary">.</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-1 sm:gap-3"
        >
          <NavLink to="/" end aria-label="Design studio" className="nav-item">
            <PanelsTopLeft size={15} />
            <span className="hidden sm:inline">Studio</span>
          </NavLink>
          <NavLink to="/projects" aria-label="Projects" className="nav-item">
            <FolderOpen size={15} />
            <span className="hidden sm:inline">Projects</span>
          </NavLink>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  aria-label="Open account menu"
                >
                  {user.email?.slice(0, 1).toUpperCase() || <User />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="truncate">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Account settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/projects")}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  My projects
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await signOut();
                    navigate("/");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              size="sm"
              className="hidden rounded-lg sm:inline-flex"
            >
              <Link to="/auth">
                Sign in <ArrowUpRight />
              </Link>
            </Button>
          )}
          {!user && (
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:hidden"
            >
              <Link to="/auth" aria-label="Sign in">
                <User />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
