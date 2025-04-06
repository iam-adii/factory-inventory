
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, ArrowUpDown, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { materialService } from "@/lib/services/materialService";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

interface Material {
  id: number;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  last_updated: string;
  threshold: number;
  bill_number?: string | null;
}

interface MaterialListProps {
  onAddNew: () => void;
  onEdit: (material: Material) => void;
}

const MaterialList: React.FC<MaterialListProps> = ({ onAddNew, onEdit }) => {
  const { isAuthenticated } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Material; direction: 'ascending' | 'descending' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await materialService.getAll();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load materials. " + error.message,
          variant: "destructive"
        });
      } else if (data) {
        setMaterials(data);
      }
    } catch (err) {
      console.error("Error fetching materials:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading materials.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleSort = (key: keyof Material) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this material?")) {
      try {
        const { error } = await materialService.delete(id);
        if (error) {
          toast({
            title: "Error",
            description: "Failed to delete material. " + error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: "Material deleted successfully."
          });
          fetchMaterials(); // Refresh the list
        }
      } catch (err) {
        console.error("Error deleting material:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred while deleting the material.",
          variant: "destructive"
        });
      }
    }
  };

  const sortedMaterials = React.useMemo(() => {
    const materialsToSort = [...materials];
    if (sortConfig !== null) {
      materialsToSort.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return materialsToSort;
  }, [materials, sortConfig]);

  const filteredMaterials = sortedMaterials.filter(material => 
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMaterials = filteredMaterials.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getStockStatus = (material: Material) => {
    if (material.current_stock <= material.threshold) {
      return "bg-red-100 text-red-800";
    } else if (material.current_stock <= material.threshold * 1.5) {
      return "bg-amber-100 text-amber-800";
    }
    return "";
  };

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-xl font-medium">Materials Inventory</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search materials..." 
                className="pl-8 w-[200px] sm:w-[300px]" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={onAddNew} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Material</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">
                  <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('name')}>
                    Name
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('category')}>
                    Category
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('current_stock')}>
                    Current Stock
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('threshold')}>
                    Threshold
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('last_updated')}>
                    Last Updated
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('bill_number')}>
                    Bill Number
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading materials...
                  </TableCell>
                </TableRow>
              ) : filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No materials found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.category}</TableCell>
                    <TableCell className={cn("text-right", getStockStatus(material))}>
                      {material.current_stock} {material.unit}
                    </TableCell>
                    <TableCell className="text-right">{material.threshold} {material.unit}</TableCell>
                    <TableCell className="text-right">{new Date(material.last_updated).toLocaleDateString()}</TableCell>
                    <TableCell>{material.bill_number || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(material)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(material.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredMaterials.length)} of {filteredMaterials.length} entries
          </p>
          <Select
            value={String(itemsPerPage)}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={String(itemsPerPage)} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 50, 100].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MaterialList;
