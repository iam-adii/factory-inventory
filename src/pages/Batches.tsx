import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Plus, Search, Trash2, Edit, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Import services
import { batchService } from "@/lib/services/batchService";
import { materialService } from "@/lib/services/materialService";
import { usageLogService } from "@/lib/services/usageLogService";

interface Material {
  id: number;
  name: string;
  current_stock?: number;
  stockAvailable?: number;
  unit?: string;
  quantity?: number;
}

interface Batch {
  id: number;
  batchNumber: string;
  batch_number?: string;
  product: string;
  date: string;
  status: string;
  description?: string;
  materials?: Material[];
}

const Batches = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loaded, setLoaded] = useState(false);
  
  const [batchForm, setBatchForm] = useState({
    id: 0,
    batchNumber: "",
    product: "",
    description: "",
    materials: [] as Material[],
  });

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [quantity, setQuantity] = useState("");

  // Fetch batches and materials from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch batches
        const { data: batchesData, error: batchesError } = await batchService.getAll();
        if (batchesError) throw batchesError;

        // Transform batch data to match component interface
        const transformedBatches = batchesData?.map(batch => ({
          id: batch.id,
          batchNumber: batch.batch_number,
          product: batch.product,
          date: new Date(batch.date).toISOString().split('T')[0],
          status: batch.status,
          description: batch.description || undefined
        })) || [];

        setBatches(transformedBatches);

        // Fetch materials
        const { data: materialsData, error: materialsError } = await materialService.getAll();
        if (materialsError) throw materialsError;

        // Transform materials data to match component interface
        const transformedMaterials = materialsData?.map(material => ({
          id: material.id,
          name: material.name,
          stockAvailable: material.current_stock,
          unit: material.unit
        })) || [];

        setAvailableMaterials(transformedMaterials);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: "There was an error loading the batch data.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAddMaterial = () => {
    if (!selectedMaterial || !quantity || parseFloat(quantity) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please select a material and enter a valid quantity",
      });
      return;
    }

    const material = availableMaterials.find(m => m.id.toString() === selectedMaterial);
    if (!material) return;

    if (parseFloat(quantity) > (material.stockAvailable || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient stock",
        description: `Only ${material.stockAvailable} ${material.unit || 'units'} available for ${material.name}`,
      });
      return;
    }

    const alreadyAdded = batchForm.materials.find(m => m.id.toString() === selectedMaterial);
    if (alreadyAdded) {
      setBatchForm(prev => ({
        ...prev,
        materials: prev.materials.map(m => 
          m.id.toString() === selectedMaterial 
            ? { ...m, quantity: (m.quantity || 0) + parseFloat(quantity) }
            : m
        ),
      }));
    } else {
      setBatchForm(prev => ({
        ...prev,
        materials: [
          ...prev.materials, 
          { ...material, quantity: parseFloat(quantity) }
        ],
      }));
    }

    setSelectedMaterial("");
    setQuantity("");
  };

  const removeMaterial = (id: number) => {
    setBatchForm(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.id !== id),
    }));
  };

  const resetForm = () => {
    setBatchForm({
      id: 0,
      batchNumber: "",
      product: "",
      description: "",
      materials: [],
    });
  };

  const handleSaveBatch = async () => {
    if (!batchForm.batchNumber || !batchForm.product || batchForm.materials.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill all fields and add at least one material",
      });
      return;
    }

    try {
      if (isEditing) {
        // Update existing batch
        const { error } = await batchService.update(batchForm.id, {
          batch_number: batchForm.batchNumber,
          product: batchForm.product,
          description: batchForm.description || null,
        });

        if (error) throw error;

        // Handle materials update (this would require additional logic to compare and update)
        // For simplicity, we'll just update the UI state here
        setBatches(prev => prev.map(batch => 
          batch.id === batchForm.id 
            ? { 
                ...batch, 
                batchNumber: batchForm.batchNumber, 
                product: batchForm.product,
                description: batchForm.description,
                materials: batchForm.materials 
              } 
            : batch
        ));
        
        toast({
          title: "Batch Updated",
          description: `Batch ${batchForm.batchNumber} has been updated successfully.`,
        });
      } else {
        // Create new batch
        const { data: newBatchData, error: batchError } = await batchService.create({
          batch_number: batchForm.batchNumber,
          product: batchForm.product,
          date: new Date().toISOString(),
          status: "In Progress",
          description: batchForm.description || null,
        });

        if (batchError || !newBatchData) throw batchError;

        // Add materials to the batch, create usage logs, and update stock levels
        for (const material of batchForm.materials) {
          // Add material to batch
          const { error: materialError } = await batchService.addMaterial({
            batch_id: newBatchData.id,
            material_id: material.id,
            quantity: material.quantity || 0,
          });

          if (materialError) throw materialError;
          
          // Create usage log entry for the material
          const { error: usageLogError } = await usageLogService.create({
            material_id: material.id,
            quantity: material.quantity || 0,
            date: new Date().toISOString(),
            username: 'System', // Using generic system identifier instead of user-specific one
            batch_id: newBatchData.id,
            notes: `Added to batch ${newBatchData.batch_number} for product ${newBatchData.product}`
          });
          
          if (usageLogError) throw usageLogError;
          
          // Update material stock level by deducting the quantity used
          const materialToUpdate = availableMaterials.find(m => m.id === material.id);
          if (materialToUpdate) {
            const currentStock = materialToUpdate.stockAvailable || 0;
            const newStock = Math.max(0, currentStock - (material.quantity || 0));
            
            const { error: stockUpdateError } = await materialService.updateStock(
              material.id,
              newStock
            );
            
            if (stockUpdateError) throw stockUpdateError;
          }
        }

        // Add the new batch to the UI state
        const newBatch = {
          id: newBatchData.id,
          batchNumber: newBatchData.batch_number,
          product: newBatchData.product,
          date: new Date(newBatchData.date).toISOString().split('T')[0],
          status: newBatchData.status,
          description: newBatchData.description || undefined,
          materials: batchForm.materials
        };
        
        setBatches(prev => [...prev, newBatch]);
        
        toast({
          title: "Batch Started",
          description: `Batch ${batchForm.batchNumber} has been started successfully.`,
        });
      }
    } catch (error) {
      console.error('Error saving batch:', error);
      toast({
        variant: "destructive",
        title: "Failed to save batch",
        description: "There was an error saving the batch data.",
      });
      return;
    }
    
    resetForm();
    setShowForm(false);
    setIsEditing(false);
  };

  const handleViewBatch = async (batch: Batch) => {
    try {
      // Fetch batch materials if not already loaded
      if (!batch.materials || batch.materials.length === 0) {
        const { data, error } = await batchService.getBatchMaterials(batch.id);
        if (error) throw error;

        // Transform materials data
        const materials = data?.map(item => ({
          id: item.material_id,
          name: item.materials.name,
          unit: item.materials.unit,
          quantity: item.quantity
        })) || [];

        batch.materials = materials;
      }

      setSelectedBatch(batch);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching batch materials:', error);
      toast({
        variant: "destructive",
        title: "Failed to load batch details",
        description: "There was an error loading the batch materials.",
      });
    }
  };

  const handleEditBatch = async (batch: Batch) => {
    try {
      // Fetch batch materials if not already loaded
      if (!batch.materials || batch.materials.length === 0) {
        const { data, error } = await batchService.getBatchMaterials(batch.id);
        if (error) throw error;

        // Transform materials data
        const materials = data?.map(item => ({
          id: item.material_id,
          name: item.materials.name,
          unit: item.materials.unit,
          quantity: item.quantity
        })) || [];

        batch.materials = materials;
      }

      setIsEditing(true);
      setSelectedBatch(batch);
      setBatchForm({
        id: batch.id,
        batchNumber: batch.batchNumber,
        product: batch.product,
        description: batch.description || "",
        materials: batch.materials || [],
      });
      setShowForm(true);
    } catch (error) {
      console.error('Error fetching batch materials for edit:', error);
      toast({
        variant: "destructive",
        title: "Failed to load batch details",
        description: "There was an error loading the batch materials for editing.",
      });
    }
  };

  const handleDeleteBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBatch = async () => {
    if (!selectedBatch) return;
    
    try {
      const { error } = await batchService.delete(selectedBatch.id);
      if (error) throw error;

      setBatches(prev => prev.filter(batch => batch.id !== selectedBatch.id));
      
      toast({
        title: "Batch Deleted",
        description: `Batch ${selectedBatch.batchNumber} has been deleted.`,
      });
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete batch",
        description: "There was an error deleting the batch.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedBatch(null);
    }
  };

  const filteredBatches = batches.filter(batch => 
    batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateBatchNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `B-${year}-${month}${day}-${random}`;
  };

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <div className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center px-3 py-1 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
              PRODUCTION
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Batch Management</h1>
            <p className="mt-1 text-muted-foreground">
              Record material usage for production batches
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
            <Database className="w-6 h-6 text-primary" />
          </div>
        </div>

        {showForm ? (
          <Card className="shadow-sm mb-6 animate-fade-in">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-medium">
                {isEditing ? "Edit Batch" : "Start New Batch"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <div className="flex">
                    <Input
                      id="batchNumber"
                      placeholder="Enter batch number"
                      value={batchForm.batchNumber}
                      onChange={(e) => setBatchForm({...batchForm, batchNumber: e.target.value})}
                    />
                    <Button
                      variant="outline"
                      className="ml-2"
                      onClick={() => setBatchForm({...batchForm, batchNumber: generateBatchNumber()})}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Input
                    id="product"
                    placeholder="Enter product name"
                    value={batchForm.product}
                    onChange={(e) => setBatchForm({...batchForm, product: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description / Notes</Label>
                <Textarea
                  id="description"
                  placeholder="Add notes about this batch (optional)"
                  value={batchForm.description}
                  onChange={(e) => setBatchForm({...batchForm, description: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-4">
                <Label>Materials</Label>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Select
                      value={selectedMaterial}
                      onValueChange={setSelectedMaterial}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMaterials.map((material) => (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            {material.name} (Available: {material.stockAvailable})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-32">
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddMaterial}>Add</Button>
                </div>

                {batchForm.materials.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchForm.materials.map((material) => (
                          <TableRow key={material.id}>
                            <TableCell>{material.name}</TableCell>
                            <TableCell className="text-right">{material.quantity} {material.unit}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeMaterial(material.id)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-md text-muted-foreground">
                    No materials added yet
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveBatch}>
                  {isEditing ? "Update Batch" : "Start Batch"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search batches..." 
                  className="pl-9 w-full sm:w-[260px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => {
                resetForm();
                setShowForm(true);
                setIsEditing(false);
              }} className="gap-1">
                <Plus className="h-4 w-4" />
                <span>New Batch</span>
              </Button>
            </div>

            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Batch Number</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array(5).fill(0).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell colSpan={5} className="h-12">
                              <div className="h-4 bg-muted animate-pulse rounded"></div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : filteredBatches.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No batches found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBatches.map((batch, index) => (
                          <TableRow 
                            key={batch.id}
                            className={cn(
                              "transition-colors hover:bg-muted/50 animate-fade-in",
                              index % 2 === 0 ? "bg-white" : "bg-muted/20"
                            )}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                            <TableCell>{batch.product}</TableCell>
                            <TableCell>{batch.date}</TableCell>
                            <TableCell>
                              <span 
                                className={cn(
                                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                  batch.status === "Completed" 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-blue-100 text-blue-800"
                                )}
                              >
                                {batch.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewBatch(batch)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditBatch(batch)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteBatch(batch)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
          </DialogHeader>
          
          {selectedBatch && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Batch Number</p>
                  <p className="font-medium">{selectedBatch.batchNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">{selectedBatch.product}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Created</p>
                  <p className="font-medium">{selectedBatch.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span 
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      selectedBatch.status === "Completed" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-blue-100 text-blue-800"
                    )}
                  >
                    {selectedBatch.status}
                  </span>
                </div>
              </div>

              {selectedBatch.description && (
                <div className="space-y-2">
                  <p className="font-medium">Description / Notes</p>
                  <div className="p-3 bg-muted/20 rounded-md text-sm">
                    {selectedBatch.description}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="font-medium">Materials</p>
                {(selectedBatch.materials && selectedBatch.materials.length > 0) ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBatch.materials.map((material) => (
                          <TableRow key={material.id}>
                            <TableCell>{material.name}</TableCell>
                            <TableCell className="text-right">{material.quantity} {material.unit}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No materials recorded for this batch.</p>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            {selectedBatch && selectedBatch.status === "In Progress" && (
              <Button 
                variant="outline" 
                className="mr-2 bg-green-100 hover:bg-green-200 text-green-800 hover:text-green-900"
                onClick={async () => {
                  try {
                    const { data, error } = await batchService.updateStatus(selectedBatch.id, "Completed");
                    if (error) throw error;
                    
                    // Update the batch in the UI
                    setBatches(prev => prev.map(batch => 
                      batch.id === selectedBatch.id 
                        ? { ...batch, status: "Completed" } 
                        : batch
                    ));
                    
                    // Update the selected batch status
                    setSelectedBatch(prev => prev ? { ...prev, status: "Completed" } : null);
                    
                    toast({
                      title: "Batch Completed",
                      description: `Batch ${selectedBatch.batchNumber} has been marked as completed.`,
                    });
                  } catch (error) {
                    console.error('Error completing batch:', error);
                    toast({
                      variant: "destructive",
                      title: "Failed to complete batch",
                      description: "There was an error updating the batch status.",
                    });
                  }
                }}
              >
                Complete Batch
              </Button>
            )}
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete batch {selectedBatch?.batchNumber}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBatch} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Batches;
