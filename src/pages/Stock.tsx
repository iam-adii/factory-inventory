
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Search, Plus, ArrowUpDown, Package2, Trash2, Edit, Eye, ChevronLeft, ChevronRight, Calendar, Filter, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { materialService } from "@/lib/services/materialService";
import { materialHistoryService, MaterialTransaction } from "@/lib/services/materialHistoryService";
import { Database } from "@/types/supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

// Define the StockItem interface based on our UI needs
interface StockItem {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  maxStock: number;
  unit: string;
  lastUpdated: string;
}

// Type for the material from Supabase
type Material = Database['public']['Tables']['materials']['Row'];

// Function to convert Material to StockItem
const mapMaterialToStockItem = (material: Material): StockItem => ({
  id: material.id,
  name: material.name,
  category: material.category,
  currentStock: material.current_stock,
  maxStock: material.threshold,
  unit: material.unit,
  lastUpdated: new Date(material.last_updated).toISOString().split('T')[0]
});

// Mock data - would come from Supabase in a real implementation
const mockStockData = [
  { id: 1, name: "Sodium Hydroxide", category: "Base", currentStock: 450, maxStock: 500, unit: "kg", lastUpdated: "2023-06-15" },
  { id: 2, name: "Hydrochloric Acid", category: "Acid", currentStock: 320, maxStock: 500, unit: "L", lastUpdated: "2023-06-16" },
  { id: 3, name: "Ethanol", category: "Solvent", currentStock: 780, maxStock: 1000, unit: "L", lastUpdated: "2023-06-14" },
  { id: 4, name: "Calcium Carbonate", category: "Mineral", currentStock: 150, maxStock: 800, unit: "kg", lastUpdated: "2023-06-13" },
  { id: 5, name: "Aluminum Oxide", category: "Oxide", currentStock: 240, maxStock: 300, unit: "kg", lastUpdated: "2023-06-12" },
  { id: 6, name: "Acetic Acid", category: "Acid", currentStock: 380, maxStock: 400, unit: "L", lastUpdated: "2023-06-11" },
  { id: 7, name: "Sodium Chloride", category: "Salt", currentStock: 500, maxStock: 600, unit: "kg", lastUpdated: "2023-06-10" },
];

// Stock Filter Component
interface StockFilterProps {
  filters: {
    category: string;
    stockStatus: string;
    dateFrom: Date | null;
    dateTo: Date | null;
  };
  categories: string[];
  onFilterChange: (filters: any) => void;
  onReset: () => void;
}

const StockFilter = ({ filters, categories, onFilterChange, onReset }: StockFilterProps) => {
  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter Stock Items
        </h3>
        <Button variant="ghost" size="sm" onClick={onReset} className="h-8">
          <X className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock Status</label>
          <Select
            value={filters.stockStatus}
            onValueChange={(value) => onFilterChange({ stockStatus: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select stock status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="low">Low Stock (Below Threshold)</SelectItem>
              <SelectItem value="critical">Critical Stock (Below 20%)</SelectItem>
              <SelectItem value="normal">Normal Stock</SelectItem>
              <SelectItem value="excess">Excess Stock (Above 90%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Updated From</label>
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
          <label className="text-sm font-medium">Updated To</label>
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

const Stock = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ 
    key: keyof StockItem; 
    direction: 'ascending' | 'descending' 
  } | null>(null);
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [stockToAdd, setStockToAdd] = useState<number>(0);
  const [billNumber, setBillNumber] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [materialHistory, setMaterialHistory] = useState<MaterialTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    category: "all",
    stockStatus: "all",
    dateFrom: null as Date | null,
    dateTo: null as Date | null
  });
  
  // Edit form state
  const [editForm, setEditForm] = useState<StockItem>({
    id: 0,
    name: "",
    category: "",
    currentStock: 0,
    maxStock: 0,
    unit: "",
    lastUpdated: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Load real data from Supabase
    const fetchMaterials = async () => {
      try {
        const { data, error } = await materialService.getAll();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Map the Supabase data to our StockItem interface
          const stockItems = data.map(mapMaterialToStockItem);
          setStockItems(stockItems);
          
          // Extract unique categories for filter
          const uniqueCategories = Array.from(new Set(stockItems.map(item => item.category)));
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
        toast({
          variant: "destructive",
          title: "Failed to load materials",
          description: "There was an error loading the materials data."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();

    const loadTimer = setTimeout(() => {
      setLoaded(true);
    }, 100);

    return () => {
      clearTimeout(loadTimer);
    };
  }, []);

  const handleSort = (key: keyof StockItem) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  const sortedStockItems = () => {
    const itemsToSort = [...stockItems];
    if (sortConfig !== null) {
      itemsToSort.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return itemsToSort;
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const resetFilters = () => {
    setFilters({
      category: "all",
      stockStatus: "all",
      dateFrom: null,
      dateTo: null
    });
    setCurrentPage(1);
  };

  const filteredStockItems = sortedStockItems().filter(item => {
    // Text search filter
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Category filter
    if (filters.category !== "all" && item.category !== filters.category) {
      return false;
    }
    
    // Stock status filter
    const percentage = Math.round((item.currentStock / item.maxStock) * 100);
    if (filters.stockStatus !== "all") {
      if (filters.stockStatus === "low" && item.currentStock > item.maxStock) {
        return false;
      }
      if (filters.stockStatus === "critical" && percentage >= 20) {
        return false;
      }
      if (filters.stockStatus === "normal" && (percentage < 20 || percentage > 90)) {
        return false;
      }
      if (filters.stockStatus === "excess" && percentage <= 90) {
        return false;
      }
    }
    
    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const itemDate = new Date(item.lastUpdated);
      
      if (filters.dateFrom && itemDate < filters.dateFrom) {
        return false;
      }
      
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        if (itemDate > endDate) {
          return false;
        }
      }
    }
    
    return true;
  });

  const totalPages = Math.ceil(filteredStockItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStockItems = filteredStockItems.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleAddStock = (item: StockItem) => {
    setSelectedItem(item);
    setStockToAdd(0);
    setBillNumber("");
    setAddStockDialogOpen(true);
  };

  const handleViewItem = async (item: StockItem) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
    // Always fetch fresh material history data when viewing an item
    setHistoryLoading(true);
    await fetchMaterialHistory(item.id);
  };

  // Function to refresh material history data
  const refreshMaterialHistory = async () => {
    if (selectedItem) {
      setHistoryLoading(true);
      await fetchMaterialHistory(selectedItem.id);
    }
  };

  const handleEditItem = (item: StockItem) => {
    setSelectedItem(item);
    setEditForm({...item});
    setEditDialogOpen(true);
  };

  const handleDeleteItem = (item: StockItem) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  // Function to fetch material history for the selected item
  const fetchMaterialHistory = async (materialId: number) => {
    setHistoryLoading(true);
    
    try {
      // Get the latest material data first to ensure we have the most up-to-date information
      const { data: materialData } = await materialService.getById(materialId);
      if (materialData) {
        // Update the selected item with the latest data
        if (selectedItem && selectedItem.id === materialId) {
          setSelectedItem(mapMaterialToStockItem(materialData));
        }
        
        // Update the stock items list with the latest data
        setStockItems(prev => prev.map(item => {
          if (item.id === materialId) {
            return mapMaterialToStockItem(materialData);
          }
          return item;
        }));
      }
      
      // Now fetch the material history with the latest data
      const { data, error } = await materialHistoryService.getMaterialHistory(materialId);
      if (error) throw error;
      setMaterialHistory(data || []);
    } catch (error) {
      console.error('Error fetching material history:', error);
      toast({
        variant: "destructive",
        title: "Failed to load material history",
        description: "There was an error loading the transaction history."
      });
      setMaterialHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveStock = async () => {
    if (!selectedItem) return;
    
    try {
      const newStock = selectedItem.currentStock + stockToAdd;
      // No longer limiting stock by threshold
      const finalStock = newStock;
      
      // First record the direct stock addition transaction
      const { error: recordError } = await materialHistoryService.recordDirectStockAddition(
        selectedItem.id,
        stockToAdd,
        billNumber
      );
      
      if (recordError) {
        throw recordError;
      }
      
      // Then update the stock in Supabase
      const { data, error } = await materialService.updateStock(selectedItem.id, finalStock);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Update the local state with the updated material
        const updatedStockItems = stockItems.map(item => {
          if (item.id === selectedItem.id) {
            return mapMaterialToStockItem(data);
          }
          return item;
        });
        
        setStockItems(updatedStockItems);
        
        // Always refresh the material history to show the new addition
        if (viewDialogOpen && selectedItem.id === data.id) {
          fetchMaterialHistory(data.id);
        }
        
        setAddStockDialogOpen(false);
        
        toast({
          title: "Stock Updated",
          description: `Added ${stockToAdd} ${selectedItem.unit} to ${selectedItem.name}`
        });
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        variant: "destructive",
        title: "Failed to update stock",
        description: "There was an error updating the stock level."
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    
    // Validate the form
    if (editForm.name.trim() === "" || editForm.maxStock <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please fill in all required fields with valid values"
      });
      return;
    }
    
    try {
      // Prepare the update data for Supabase
      const updates = {
        name: editForm.name,
        category: editForm.category,
        threshold: editForm.maxStock,
        unit: editForm.unit
      };
      
      // Update the material in Supabase
      const { data, error } = await materialService.update(editForm.id, updates);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Update the local state with the updated material
        const updatedStockItems = stockItems.map(item => {
          if (item.id === editForm.id) {
            return mapMaterialToStockItem(data);
          }
          return item;
        });
        
        setStockItems(updatedStockItems);
        setEditDialogOpen(false);
        
        // If the view dialog is open for the edited item, refresh the material history
        if (viewDialogOpen && selectedItem && selectedItem.id === data.id) {
          setSelectedItem(mapMaterialToStockItem(data));
          fetchMaterialHistory(data.id);
        }
        
        toast({
          title: "Item Updated",
          description: `${editForm.name} has been updated successfully`
        });
      }
    } catch (error) {
      console.error('Error updating material:', error);
      toast({
        variant: "destructive",
        title: "Failed to update material",
        description: "There was an error updating the material."
      });
    }
  };

  const confirmDeleteItem = async () => {
    if (!selectedItem) return;
    
    try {
      // Delete the material from Supabase
      const { error } = await materialService.delete(selectedItem.id);
      
      if (error) {
        throw error;
      }
      
      // Remove the item from local state
      setStockItems(prev => prev.filter(item => item.id !== selectedItem.id));
      setDeleteDialogOpen(false);
      
      // Close view dialog if it's open for the deleted item
      if (viewDialogOpen && selectedItem) {
        setViewDialogOpen(false);
      }
      
      toast({
        title: "Item Deleted",
        description: `${selectedItem.name} has been deleted from inventory`
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete material",
        description: "There was an error deleting the material."
      });
    }
  };

  const calculatePercentage = (current: number, max: number) => {
    return Math.min(Math.round((current / max) * 100), 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 20) return "bg-destructive";
    if (percentage < 40) return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <div className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center px-3 py-1 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
              INVENTORY
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Stock Management</h1>
            <p className="mt-1 text-muted-foreground">
              Monitor and update stock levels for all materials
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
            <Package2 className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Filter Toggle Button */}
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        {/* Stock Filters */}
        {showFilters && (
          <StockFilter 
            filters={filters} 
            categories={categories}
            onFilterChange={handleFilterChange} 
            onReset={resetFilters} 
          />
        )}

        {/* Stock Table with Action Buttons */}
        <Card className="shadow-sm">
          <CardFooter className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {filteredStockItems.length} items total
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Items per page</p>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={handleItemsPerPageChange}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={itemsPerPage.toString()} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={pageSize.toString()}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardFooter>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-xl font-medium">Stock Inventory</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search materials..." 
                    className="pl-9 w-full sm:w-[260px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      <Button variant="ghost" className="p-0 h-8 font-medium" onClick={() => handleSort('name')}>
                        Name <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[150px]">
                      <Button variant="ghost" className="p-0 h-8 font-medium" onClick={() => handleSort('category')}>
                        Category <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[150px]">
                      <Button variant="ghost" className="p-0 h-8 font-medium" onClick={() => handleSort('currentStock')}>
                        Current Stock <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[150px]">
                      <Button variant="ghost" className="p-0 h-8 font-medium" onClick={() => handleSort('maxStock')}>
                        Low Stock Threshold <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center w-[100px]">Unit</TableHead>
                    <TableHead className="w-[150px]">
                      <Button variant="ghost" className="p-0 h-8 font-medium" onClick={() => handleSort('lastUpdated')}>
                        Last Updated <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center w-[100px]">Stock Level</TableHead>
                    <TableHead className="text-center w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5).fill(0).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={8} className="h-12">
                          <div className="h-4 bg-muted animate-pulse rounded"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredStockItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No stock items found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStockItems.map((item, index) => {
                      const percentage = calculatePercentage(item.currentStock, item.maxStock);
                      const progressColor = getProgressColor(percentage);
                      
                      return (
                        <TableRow
                          key={item.id}
                          className={cn(
                            "transition-colors hover:bg-muted/50 animate-fade-in",
                            index % 2 === 0 ? "bg-white" : "bg-muted/20"
                          )}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary">
                              {item.category}
                            </span>
                          </TableCell>
                          <TableCell>{item.currentStock}</TableCell>
                          <TableCell>{item.maxStock}</TableCell>
                          <TableCell className="text-center">{item.unit}</TableCell>
                          <TableCell>{item.lastUpdated}</TableCell>
                          <TableCell>
                            <div className="w-full h-2">
                              <Progress
                                value={percentage}
                                className={`h-2 ${progressColor}`}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewItem(item)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleAddStock(item)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteItem(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Stock Dialog */}
      <Dialog open={addStockDialogOpen} onOpenChange={setAddStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Material</Label>
                <div className="col-span-3 font-medium">
                  {selectedItem.name} ({selectedItem.category})
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Current Stock</Label>
                <div className="col-span-3">
                  {selectedItem.currentStock} / {selectedItem.maxStock} {selectedItem.unit}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stockToAdd" className="text-right">
                  Add Stock
                </Label>
                <Input
                  id="stockToAdd"
                  type="number"
                  min="0"
                  max={selectedItem.maxStock - selectedItem.currentStock}
                  value={stockToAdd}
                  onChange={(e) => setStockToAdd(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="billNumber" className="text-right">
                  Bill Number
                </Label>
                <Input
                  id="billNumber"
                  placeholder="Enter bill/invoice number"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAddStockDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveStock}
              disabled={!stockToAdd || stockToAdd <= 0}
            >
              Add Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          // Refresh material history when dialog is opened
          if (open && selectedItem) {
            // Force a fresh fetch of material history data
            setHistoryLoading(true);
            fetchMaterialHistory(selectedItem.id);
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px] p-4 pt-6 pb-4">
          <DialogHeader className="pb-2">
            <DialogTitle>Material Details</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedItem.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedItem.category}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Stock</p>
                  <p className="font-medium">{selectedItem.currentStock} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Threshold</p>
                  <p className="font-medium">{selectedItem.maxStock} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{selectedItem.lastUpdated}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Stock Level</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{selectedItem.currentStock} / {selectedItem.maxStock} {selectedItem.unit}</span>
                    <span>{calculatePercentage(selectedItem.currentStock, selectedItem.maxStock)}%</span>
                  </div>
                  <Progress
                    value={calculatePercentage(selectedItem.currentStock, selectedItem.maxStock)}
                    className={`h-2 ${getProgressColor(calculatePercentage(selectedItem.currentStock, selectedItem.maxStock))}`}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Material Stock Summary</h3>
                </div>
                
                {historyLoading ? (
                  <div className="py-4 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading stock history...</p>
                  </div>
                ) : materialHistory.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground">No stock history available for this material.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="max-h-[300px] overflow-y-auto">
                      <div className="p-4 bg-muted/20 border-b">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Stock Added</p>
                            <p className="text-xl font-medium">
                              {materialHistory.reduce((sum, t) => sum + (t.inflow || 0), 0)} {selectedItem.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Stock Used</p>
                            <p className="text-xl font-medium">
                              {materialHistory.reduce((sum, t) => sum + (t.outflow || 0), 0)} {selectedItem.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Balance</p>
                            <p className="text-xl font-medium">
                              {selectedItem.currentStock} {selectedItem.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Table>
                        <TableHeader className="sticky top-0 bg-white z-10">
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Transaction Type</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {materialHistory.map((transaction) => {
                            return (
                              <TableRow key={transaction.id} className={transaction.category === 'Purchase' ? 'bg-green-50' : 'bg-amber-50'}>
                                <TableCell>{transaction.formattedDate || ''}</TableCell>
                                <TableCell>
                                  {transaction.category === 'Purchase' ? 'Stock Added' : 'Stock Used'}
                                  {transaction.reference !== '-' && ` (Ref: ${transaction.reference})`}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {transaction.inflow !== null ? 
                                    <span className="text-green-600">+{transaction.inflow}</span> : 
                                    transaction.outflow !== null ? 
                                    <span className="text-amber-600">-{transaction.outflow}</span> : 
                                    '—'}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {transaction.stock} {selectedItem.unit}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">Category</Label>
              <Input
                id="edit-category"
                value={editForm.category}
                onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-max-stock" className="text-right">Low Stock Threshold</Label>
              <Input
                id="edit-max-stock"
                type="number"
                min="0"
                value={editForm.maxStock}
                onChange={(e) => setEditForm({...editForm, maxStock: Number(e.target.value)})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-unit" className="text-right">Unit</Label>
              <Select
                value={editForm.unit}
                onValueChange={(value) => setEditForm({...editForm, unit: value})}
              >
                <SelectTrigger id="edit-unit" className="col-span-3">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KG">KG</SelectItem>
                  <SelectItem value="Pcs">Pcs</SelectItem>
                  <SelectItem value="Mtr">Mtr</SelectItem>
                  <SelectItem value="RFT">RFT</SelectItem>
                  <SelectItem value="SQM">SQM</SelectItem>
                  <SelectItem value="SQFT">SQFT</SelectItem>
                  <SelectItem value="PKT">PKT</SelectItem>
                  <SelectItem value="DRM">DRM</SelectItem>
                  <SelectItem value="BOX">BOX</SelectItem>
                  <SelectItem value="CASE">CASE</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="gm">gm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedItem?.name} from your inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Stock;
