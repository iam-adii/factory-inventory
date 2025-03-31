
import { useState, useEffect } from "react";
import MaterialList from "@/components/Materials/MaterialList";
import MaterialForm from "@/components/Materials/MaterialForm";
import { Beaker } from "lucide-react";
import { materialService } from "@/lib/services/materialService";
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

const Materials = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  const handleAddNew = () => {
    setSelectedMaterial(undefined);
    setShowForm(true);
  };

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
    setShowForm(true);
  };

  const handleSave = async (material: any) => {
    // Refresh the material list after saving
    setShowForm(false);
    // No need to manually refresh as the MaterialList component handles this
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <div className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center px-3 py-1 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
              INVENTORY
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Materials Management</h1>
            <p className="mt-1 text-muted-foreground">
              Add, edit and monitor your chemical inventory
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
            <Beaker className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="space-y-6">
          {showForm ? (
            <MaterialForm 
              material={selectedMaterial} 
              onClose={() => setShowForm(false)}
              onSave={handleSave}
            />
          ) : (
            <MaterialList onAddNew={handleAddNew} onEdit={handleEdit} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Materials;
