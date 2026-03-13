import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { RefreshCcw } from "lucide-react";

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ 
  message = "Initialising HorizonFit..." 
}) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 8000); // 8 seconds timeout
    return () => clearTimeout(timer);
  }, []);

  if (timedOut) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-4 text-center">
        <div className="mb-6 h-1 w-24 rounded-full bg-destructive/20 overflow-hidden">
          <div className="h-full w-full bg-destructive" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          Taking too long to connect
        </h2>
        <p className="mb-8 max-w-xs text-muted-foreground">
          We're having trouble reaching the server. Please check your connection or refresh the page.
        </p>
        <Button 
          onClick={() => window.location.reload()}
          variant="phoenix"
          className="min-w-[160px]"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="relative mb-6">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-primary/20" />
        </div>
      </div>
      <p className="animate-pulse text-sm font-medium text-muted-foreground">
        {message}
      </p>
    </div>
  );
};
