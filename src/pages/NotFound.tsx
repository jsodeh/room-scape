
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-medium text-gray-800">Page not found</h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button asChild className="mt-6">
          <Link to="/">Return to home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
