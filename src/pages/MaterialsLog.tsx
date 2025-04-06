import { useState, useEffect, useRef } from "react";
import { FileText, RefreshCcw } from "lucide-react";
import { MaterialLogTable } from "@/components/MaterialsLog/MaterialLogTable";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MaterialsLog = () => {
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({
    material: "all",
    action_type: "all",
    dateFrom: null,
    dateTo: null,
    user: "all"
  });
  const location = useLocation();
  const tableRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Check if we came from adding a new material and refresh automatically
  useEffect(() => {
    if (location.state?.newMaterial) {
      handleRefresh();
      // Clear the state to prevent multiple refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <div className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center px-3 py-1 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
              AUDIT TRAIL
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Materials Log</h1>
            <p className="mt-1 text-muted-foreground">
              Track all material-related activities including creation, updates, and deletions
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh Logs
            </Button>
            <div className="hidden md:flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <MaterialLogTable 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            refreshKey={refreshKey} 
          />
        </div>
      </div>
    </div>
  );
};

export default MaterialsLog;