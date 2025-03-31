
import { useState, useEffect } from "react";
import { Calendar, X } from "lucide-react";
import { materialService } from "@/lib/services/materialService";
import { usageLogService } from "@/lib/services/usageLogService";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface UsageLogFilterProps {
  filters: {
    material: string;
    category: string;
    dateFrom: Date | null;
    dateTo: Date | null;
    user: string;
  };
  onFilterChange: (filters: any) => void;
}

const UsageLogFilter = ({ filters, onFilterChange }: UsageLogFilterProps) => {
  const [materials, setMaterials] = useState<{id: number, name: string}[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [users, setUsers] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch materials and users from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch materials
        const { data: materialsData, error: materialsError } = await materialService.getAll();
        if (materialsError) throw materialsError;

        if (materialsData) {
          // Transform materials data
          const transformedMaterials = materialsData.map(material => ({
            id: material.id,
            name: material.name
          }));
          setMaterials(transformedMaterials);

          // Extract unique categories
          const uniqueCategories = Array.from(new Set(materialsData.map(m => m.category)));
          setCategories(uniqueCategories);
        }

        // Get unique users from usage logs
        const { data: logsData, error: logsError } = await usageLogService.getAll();
        if (logsError) throw logsError;

        if (logsData) {
          // Extract unique usernames and create user objects
          const uniqueUsernames = Array.from(new Set(logsData.map(log => log.username)));
          const userObjects = uniqueUsernames.map((username, index) => ({
            id: index + 1,
            name: username
          }));
          setUsers(userObjects);
        }
      } catch (error) {
        console.error('Error fetching filter data:', error);
        toast({
          variant: "destructive",
          title: "Failed to load filter data",
          description: "There was an error loading the filter options.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  const handleReset = () => {
    onFilterChange({
      material: "",
      category: "",
      dateFrom: null,
      dateTo: null,
      user: ""
    });
  };

  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Filter Usage Logs</h3>
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-8">
          <X className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Material</label>
          <Select
            value={filters.material}
            onValueChange={(value) => onFilterChange({ material: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Materials</SelectItem>
              {materials.map((material) => (
                <SelectItem key={material.id} value={material.name}>
                  {material.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select
            value={filters.category}
            onValueChange={(value) => onFilterChange({ category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">User</label>
          <Select
            value={filters.user}
            onValueChange={(value) => onFilterChange({ user: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.name}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Date From</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.dateFrom || undefined}
                onSelect={(date) => onFilterChange({ dateFrom: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Date To</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(filters.dateTo, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.dateTo || undefined}
                onSelect={(date) => onFilterChange({ dateTo: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default UsageLogFilter;
