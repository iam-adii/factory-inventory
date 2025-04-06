
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { materialService } from "@/lib/services/materialService";

interface MaterialFormProps {
  material?: {
    id: number;
    name: string;
    category: string;
    current_stock: number;
    unit: string;
    threshold?: number;
    bill_number?: string | null;
  };
  onClose: () => void;
  onSave: (material: any) => void;
}

const categories = ["Raw Material", "Chemicals", "GI Coil", "PPGL coil", "Screw", "Board", "Puf Panel", "Chemical", "Insulation", "Adhesives"];
const units = ["KG", "Pcs", "Mtr", "RFT", "SQM", "SQFT", "PKT", "DRM", "BOX", "CASE", "L", "cm", "gm"];

const MaterialForm: React.FC<MaterialFormProps> = ({ material, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: material?.id || 0,
    name: material?.name || "",
    category: material?.category || "",
    current_stock: material?.current_stock || 0,
    unit: material?.unit || "",
    threshold: material?.threshold || 0,
    bill_number: material?.bill_number || "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const isEditMode = !!material;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Material name is required";
    }
    
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    
    if (formData.current_stock < 0) {
      newErrors.current_stock = "Stock cannot be negative";
    }
    
    if (!formData.unit) {
      newErrors.unit = "Unit is required";
    }

    if (formData.threshold < 0) {
      newErrors.threshold = "Threshold cannot be negative";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      let result;
      
      if (isEditMode) {
        // Update existing material
        result = await materialService.update(formData.id, {
          name: formData.name,
          category: formData.category,
          current_stock: formData.current_stock,
          unit: formData.unit,
          threshold: formData.threshold,
          bill_number: formData.bill_number || null
        });
      } else {
        // Create new material
        result = await materialService.create({
          name: formData.name,
          category: formData.category,
          current_stock: formData.current_stock,
          unit: formData.unit,
          threshold: formData.threshold,
          bill_number: formData.bill_number || null
        });
      }
      
      if (result.error) {
        toast({
          title: "Error",
          description: `Failed to ${isEditMode ? 'update' : 'create'} material: ${result.error.message}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: isEditMode ? "Material Updated" : "Material Added",
          description: `${formData.name} has been ${isEditMode ? "updated" : "added"} successfully.`
        });
        onSave(result.data);
      }
    } catch (error) {
      console.error("Error saving material:", error);
      toast({
        title: "Error",
        description: `An unexpected error occurred while ${isEditMode ? 'updating' : 'creating'} the material.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Card className="shadow-sm animate-in fade-in-50 duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-medium">
            {isEditMode ? "Edit Material" : "Add New Material"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Material Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter material name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current_stock">Current Stock</Label>
              <Input
                id="current_stock"
                type="number"
                value={formData.current_stock}
                onChange={(e) => handleChange("current_stock", parseFloat(e.target.value) || 0)}
                disabled={isEditMode}
                className={`${errors.current_stock ? "border-red-500" : ""} ${isEditMode ? "bg-gray-100" : ""}`}
              />
              {errors.current_stock && <p className="text-xs text-red-500">{errors.current_stock}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleChange("unit", value)}
              >
                <SelectTrigger className={errors.unit ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && <p className="text-xs text-red-500">{errors.unit}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="threshold">Low Stock Threshold</Label>
              <Input
                id="threshold"
                type="number"
                value={formData.threshold}
                onChange={(e) => handleChange("threshold", parseFloat(e.target.value) || 0)}
                className={errors.threshold ? "border-red-500" : ""}
              />
              {errors.threshold && <p className="text-xs text-red-500">{errors.threshold}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bill_number">Bill Number</Label>
              <Input
                id="bill_number"
                value={formData.bill_number}
                onChange={(e) => handleChange("bill_number", e.target.value)}
                placeholder="Enter bill number"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditMode ? "Update Material" : "Add Material"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default MaterialForm;
