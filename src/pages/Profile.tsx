import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileForm from "@/components/profile/ProfileForm";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
export default function Profile() {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [params] = useSearchParams();
  if (params.get("tab") === "projects")
    return <Navigate to="/projects" replace />;
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="page-width max-w-3xl flex-1 py-12">
        <p className="eyebrow mb-3">A space of your own</p>
        <h1 className="editorial-title mb-8 text-4xl">Your account.</h1>
        {loading ? (
          <Loader2 className="animate-spin" aria-label="Loading account" />
        ) : user ? (
          <div className="studio-panel space-y-8 p-6 sm:p-8">
            <ProfileForm user={user} />
            <div className="border-t pt-6">
              <label
                htmlFor="account-theme"
                className="mb-3 block text-sm font-semibold"
              >
                Appearance
              </label>
              <select
                id="account-theme"
                value={theme}
                onChange={(event) =>
                  setTheme(event.target.value as "light" | "dark" | "system")
                }
                className="studio-input"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">Match device</option>
              </select>
            </div>
            {user.app_metadata?.role === "admin" && (
              <Button asChild variant="outline">
                <Link to="/admin/furniture">Manage furniture resources</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="studio-panel p-8">
            <p className="mb-5 text-sm text-muted-foreground">
              Sign in to manage your profile and preferences.
            </p>
            <Button asChild>
              <Link to="/auth?next=/profile">Sign in</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
