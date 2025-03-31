
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, File, Download, MoreHorizontal, Search, Calendar } from "lucide-react";
import { usageLogService } from "@/lib/services/usageLogService";
import { materialService } from "@/lib/services/materialService";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface UsageLogTableProps {
  filters: {
    material: string;
    category: string;
    dateFrom: Date | null;
    dateTo: Date | null;
    user: string;
  };
  onFilterChange: (filters: any) => void;
}

// Transform Supabase data to component format
const transformUsageLogs = (logs: any[]) => {
  return logs.map(log => ({
    id: log.id,
    material: log.materials?.name || 'Unknown',
    category: log.materials?.category || 'Unknown',
    quantity: log.quantity,
    unit: log.materials?.unit || '',
    date: new Date(log.date),
    user: log.username, // Using username field from database
    batch: log.batches?.batch_number || 'N/A',
    notes: log.notes || '',
    material_id: log.material_id
  }));
};

export const UsageLogTable = ({ filters, onFilterChange }: UsageLogTableProps) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState({ column: "date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const logsPerPage = 10;

  useEffect(() => {
    const fetchUsageLogs = async () => {
      setLoading(true);
      try {
        // Prepare filter parameters for API call
        const filterParams: any = {};
        
        // First, fetch all materials to get the material_id from name
        let materialId: number | undefined;
        
        if (filters.material) {
          const { data: materialsData } = await materialService.getAll();
          if (materialsData) {
            const material = materialsData.find(m => m.name === filters.material);
            if (material) {
              materialId = material.id;
              filterParams.material_id = materialId;
            }
          }
        }
        
        if (filters.user) {
          filterParams.username = filters.user; // Fixed: changed from user to username
        }
        
        if (filters.dateFrom) {
          filterParams.dateFrom = filters.dateFrom.toISOString();
        }
        
        if (filters.dateTo) {
          const endDate = new Date(filters.dateTo);
          endDate.setHours(23, 59, 59, 999);
          filterParams.dateTo = endDate.toISOString();
        }
        
        // Fetch logs from Supabase using the getFiltered method
        const { data, error } = await usageLogService.getFiltered(filterParams);
        
        if (error) throw error;
        
        if (!data) {
          setLogs([]);
          return;
        }
        
        // Transform the data to match component format
        let transformedLogs = transformUsageLogs(data);
        
        // Apply client-side filtering for category since it's not directly supported in the API
        if (filters.category) {
          transformedLogs = transformedLogs.filter(log => log.category === filters.category);
        }
        
        // Apply search term filtering (client-side)
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          transformedLogs = transformedLogs.filter(log => 
            log.material.toLowerCase().includes(search) ||
            log.category.toLowerCase().includes(search) ||
            log.batch.toLowerCase().includes(search) ||
            log.user.toLowerCase().includes(search) ||
            (log.notes && log.notes.toLowerCase().includes(search))
          );
        }
        
        // Apply sorting
        transformedLogs.sort((a, b) => {
          if (sorting.column === "date") {
            return sorting.direction === "asc" 
              ? new Date(a.date).getTime() - new Date(b.date).getTime()
              : new Date(b.date).getTime() - new Date(a.date).getTime();
          }
          
          if (sorting.column === "quantity") {
            return sorting.direction === "asc" 
              ? a.quantity - b.quantity
              : b.quantity - a.quantity;
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
        console.error('Error fetching usage logs:', error);
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: "There was an error loading the usage logs.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsageLogs();
  }, [filters, sorting, searchTerm]);


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
      day: "numeric"
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {logs.length} usage records
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
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[180px] cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center">
                  Date {getSortIcon("date")}
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
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center">
                  Category {getSortIcon("category")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("quantity")}
              >
                <div className="flex items-center">
                  Quantity {getSortIcon("quantity")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("batch")}
              >
                <div className="flex items-center">
                  Batch {getSortIcon("batch")}
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center h-full">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No usage logs found.
                </TableCell>
              </TableRow>
            ) : (
              currentLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {formatDate(log.date)}
                  </TableCell>
                  <TableCell>{log.material}</TableCell>
                  <TableCell>
                    <Badge variant={log.category === "Chemicals" ? "destructive" : "secondary"} className="bg-opacity-60">
                      {log.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.quantity} {log.unit}
                  </TableCell>
                  <TableCell>{log.batch}</TableCell>
                  <TableCell>{log.user}</TableCell>
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
}
