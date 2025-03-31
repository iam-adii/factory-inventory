
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-primary/10">
          <span className="text-2xl font-bold text-primary">404</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Page not found</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Button onClick={() => navigate("/")} size="lg" className="animate-pulse-slow">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
