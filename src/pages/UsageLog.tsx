
import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { UsageLogTable } from "@/components/UsageLog/UsageLogTable";

const UsageLog = () => {
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState({
    material: "",
    category: "",
    dateFrom: null,
    dateTo: null
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  };

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <div className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center px-3 py-1 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
              TRACKING
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Usage Log</h1>
            <p className="mt-1 text-muted-foreground">
              Track and monitor material usage across operations
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
            <FileText className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="space-y-6">
          <UsageLogTable filters={filters} onFilterChange={handleFilterChange} />
        </div>
      </div>
    </div>
  );
};

export default UsageLog;
