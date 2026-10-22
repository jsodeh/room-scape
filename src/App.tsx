import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { StagingProvider } from "@/context/StagingContext";
import Index from "@/pages/Index";
import Projects from "@/pages/Projects";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Profile from "@/pages/Profile";
import ProjectDetail from "@/pages/ProjectDetail";
const AdminFurniture = lazy(() => import("@/pages/AdminFurniture"));
const queryClient = new QueryClient();
function Notifications() {
  const { theme } = useTheme();
  return <Sonner theme={theme} richColors closeButton position="top-right" />;
}
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <BrowserRouter>
            <StagingProvider>
              <a
                href="#main-content"
                className="sr-only z-50 rounded-lg bg-card p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
              >
                Skip to content
              </a>
              <Suspense
                fallback={
                  <main
                    id="main-content"
                    className="page-width py-20"
                    role="status"
                  >
                    Opening your workspace…
                  </main>
                }
              >
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route
                    path="/projects/:projectId"
                    element={<ProjectDetail />}
                  />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin/furniture" element={<AdminFurniture />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Toaster />
              <Notifications />
            </StagingProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
