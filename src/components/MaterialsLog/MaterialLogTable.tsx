import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, File, Download, Search, Calendar, RefreshCcw } from "lucide-react";
import { materialLogService, MaterialLog } from "@/lib/services/materialLogService";
import { materialService } from "@/lib/services/materialService";
import { toast } from "@/hooks/use-toast";
import MaterialLogFilter from "./MaterialLogFilter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface MaterialLogTableProps {
  filters: {
    material: string;
    action_type: string;
    dateFrom: Date | null;
    dateTo: Date | null;
    user: string;
  };
  onFilterChange: (filters: any) => void;
  refreshKey?: number;
}

// Transform Supabase data to component format
const transformMaterialLogs = (logs: any[]): any[] => {
  if (!logs || !Array.isArray(logs)) return [];
  
  return logs.map(log => {
    // Extract material information - handle both direct and nested data structures
    // Supabase can return nested objects in different formats depending on the query
    const materialInfo = log?.materials || {};
    
    // For deleted materials (where material_id is null), get the name from details
    let materialName = materialInfo?.name || log?.material_name || 'Unknown';
    let materialCategory = materialInfo?.category || log?.material_category || 'Unknown';
    
    // If this is a delete action and material_id is null, extract name from details
    if (log?.action_type === 'delete' && !log?.material_id) {
      const details = typeof log?.details === 'string' ? JSON.parse(log?.details) : (log?.details || {});
      materialName = details?.name || materialName;
      materialCategory = details?.category || materialCategory;
    }
    
    return {
      id: log?.id || 0,
      material: materialName,
      category: materialCategory,
      action_type: log?.action_type || 'Unknown',
      user: log?.username || 'System', // Using username field from database
      timestamp: log?.timestamp ? new Date(log.timestamp) : new Date(),
      details: typeof log?.details === 'string' ? JSON.parse(log?.details) : (log?.details || {}),
      material_id: log?.material_id || 0
    };
  });
};

export const MaterialLogTable = ({ filters, onFilterChange, refreshKey = 0 }: MaterialLogTableProps) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState({ column: "timestamp", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const logsPerPage = 10;

  // Update refreshTrigger when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      setRefreshTrigger(refreshKey);
    }
  }, [refreshKey]);

  useEffect(() => {
    const fetchMaterialLogs = async () => {
      setLoading(true);
      try {
        // Prepare filter parameters for API call
        const filterParams: any = {};
        
        // First, fetch all materials to get the material_id from name
        let materialId: number | undefined;
        
        if (filters.material && filters.material !== 'all') {
          try {
            const { data: materialsData, error: materialsError } = await materialService.getAll();
            if (materialsError) {
              console.error('Error fetching materials:', materialsError);
              toast({
                variant: "destructive",
                title: "Failed to load materials",
                description: "There was an error loading the materials data.",
              });
            }
            
            if (materialsData) {
              const material = materialsData.find(m => m.name === filters.material);
              if (material) {
                materialId = material.id;
                filterParams.material_id = materialId;
              }
            }
          } catch (err) {
            console.error('Error in material lookup:', err);
          }
        }
        
        if (filters.action_type && filters.action_type !== 'all') {
          filterParams.action_type = filters.action_type;
        }
        
        if (filters.user && filters.user !== 'all') {
          filterParams.username = filters.user; // Changed from user to username to match service parameter
        }
        
        if (filters.dateFrom) {
          filterParams.dateFrom = filters.dateFrom.toISOString();
        }
        
        if (filters.dateTo) {
          const endDate = new Date(filters.dateTo);
          endDate.setHours(23, 59, 59, 999);
          filterParams.dateTo = endDate.toISOString();
        }
        
        console.log('Fetching material logs with params:', filterParams);
        
        // Always fetch all logs first to ensure we have the most recent data
        const { data: allLogsData, error: allLogsError } = await materialLogService.getAll();
        
        if (allLogsError) {
          console.error('Error fetching all material logs:', allLogsError);
          toast({
            variant: "destructive",
            title: "Failed to load data",
            description: "There was an error loading the material logs.",
          });
          setLogs([]);
          return;
        }
        
        // Then apply filters if needed
        let logsData = allLogsData;
        if (Object.keys(filterParams).length > 0) {
          try {
            const { data, error } = await materialLogService.getFiltered(filterParams);
            
            if (!error && data) {
              logsData = data;
            } else {
              console.warn('Using unfiltered data due to filter error:', error);
              // Continue with all logs if filtering fails
            }
          } catch (filterError) {
            console.warn('Using unfiltered data due to filter error:', filterError);
            // Continue with all logs if filtering fails
          }
        }
        
        if (!logsData || !Array.isArray(logsData)) {
          console.log('No material logs data found or invalid data format');
          setLogs([]);
          return;
        }
        
        console.log('Material logs data received:', logsData.length, 'entries');
        
        // Transform the data to match component format
        let transformedLogs = transformMaterialLogs(logsData);
        
        // Apply search term filtering (client-side)
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          transformedLogs = transformedLogs.filter(log => 
            log.material.toLowerCase().includes(search) ||
            log.category.toLowerCase().includes(search) ||
            log.action_type.toLowerCase().includes(search) ||
            log.user.toLowerCase().includes(search) ||
            (log.details && JSON.stringify(log.details).toLowerCase().includes(search))
          );
        }
        
        // Apply sorting
        transformedLogs.sort((a, b) => {
          if (sorting.column === "timestamp") {
            return sorting.direction === "asc" 
              ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          }
          
          // String columns
          const valueA = a[sorting.column]?.toString().toLowerCase() || "";
          const valueB = b[sorting.column]?.toString().toLowerCase() || "";
          
          return sorting.direction === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        });
        
        setLogs(transformedLogs);
      } catch (error) {
        console.error('Error fetching material logs:', error);
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: "There was an error loading the material logs.",
        });
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterialLogs();
  }, [filters, sorting, searchTerm, refreshTrigger]);


  const handleSort = (column: string) => {
    setSorting({
      column,
      direction: 
        sorting.column === column && sorting.direction === "asc" 
          ? "desc" 
          : "asc"
    });
  };

  const getSortIcon = (column: string) => {
    if (sorting.column !== column) {
      return <ChevronDown className="ml-1 h-4 w-4 opacity-50" />;
    }
    return sorting.direction === "asc" 
      ? <ChevronUp className="ml-1 h-4 w-4" />
      : <ChevronDown className="ml-1 h-4 w-4" />;
  };

  // Get current logs for pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Function to get action badge color
  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Function to format action type for display
  const formatActionType = (action: string) => {
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  // Function to render details based on action type
  const renderDetails = (log: any) => {
    if (!log.details) return 'No details available';

    try {
      // Ensure details is an object
      const details = typeof log.details === 'string' 
        ? JSON.parse(log.details) 
        : (log.details || {});
      
      switch (log.action_type) {
        case 'create':
          if (details.current_stock !== undefined && details.unit) {
            return `Created with initial stock: ${details.current_stock} ${details.unit}`;
          }
          return `Created new material`;
        
        case 'update':
          if (details.changes && Object.keys(details.changes).length > 0) {
            try {
              const changesList = Object.entries(details.changes).map(([key, value]: [string, any]) => {
                // Handle different formats of change data
                if (value && typeof value === 'object') {
                  const oldVal = value.old !== undefined ? value.old : 'N/A';
                  const newVal = value.new !== undefined ? value.new : 'N/A';
                  return `${key.replace(/_/g, ' ')}: ${oldVal} → ${newVal}`;
                } else {
                  return `${key.replace(/_/g, ' ')} changed`;
                }
              }).join(', ');
              return changesList || 'Updated material';
            } catch (changeError) {
              console.error('Error processing changes:', changeError);
              return 'Updated material properties';
            }
          }
          return 'Updated with no significant changes';
        
        case 'delete':
          if (details.current_stock !== undefined) {
            const unit = details.unit || '';
            return `Deleted material with stock: ${details.current_stock} ${unit}`.trim();
          }
          return 'Deleted material';
        
        default:
          // Safely stringify the details object
          try {
            return JSON.stringify(details, null, 2);
          } catch (stringifyError) {
            console.error('Error stringifying details:', stringifyError);
            return 'Complex details (cannot display)';
          }
      }
    } catch (e) {
      console.error('Error parsing or rendering details:', e);
      return 'Error displaying details';
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <MaterialLogFilter filters={filters} onFilterChange={onFilterChange} />
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {logs.length} log entries
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, "MMM d, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateFrom || undefined}
                  onSelect={(date) => onFilterChange({ dateFrom: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateTo || undefined}
                  onSelect={(date) => onFilterChange({ dateTo: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[180px] cursor-pointer"
                onClick={() => handleSort("timestamp")}
              >
                <div className="flex items-center">
                  Timestamp {getSortIcon("timestamp")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("material")}
              >
                <div className="flex items-center">
                  Material {getSortIcon("material")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("action_type")}
              >
                <div className="flex items-center">
                  Action {getSortIcon("action_type")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("user")}
              >
                <div className="flex items-center">
                  User {getSortIcon("user")}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Details
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center h-full">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No material logs found.
                </TableCell>
              </TableRow>
            ) : (
              currentLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell>{log.material}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={getActionBadgeVariant(log.action_type)}
                      className="bg-opacity-60"
                    >
                      {formatActionType(log.action_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell className="max-w-md truncate" title={renderDetails(log)}>
                    {renderDetails(log)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {logs.length > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }).map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  isActive={currentPage === index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};