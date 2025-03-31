
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowDownUp, ClipboardList, Download, Zap, Package2, AlertCircle, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { materialService } from "@/lib/services/materialService";

const QuickActions = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [materialCount, setMaterialCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all materials count
        const { data: materials } = await materialService.getAll();
        if (materials) {
          setMaterialCount(materials.length);
        }

        // Get low stock count
        const { data: lowStock } = await materialService.getLowStock();
        if (lowStock) {
          setLowStockCount(lowStock.length);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();

    const timer = setTimeout(() => {
      setVisible(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="shadow-sm h-full border-0 bg-white/95 backdrop-blur-sm dark:bg-gray-900/90">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center gap-2">
          <Zap className="h-5 w-5 text-green-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-primary/10 rounded-lg p-3 flex items-center justify-between dark:bg-primary/20">
            <div>
              <div className="text-xs text-muted-foreground">Total Materials</div>
              <div className="text-2xl font-semibold">{materialCount}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center dark:bg-primary/30">
              <Package2 className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="bg-red-500/10 rounded-lg p-3 flex items-center justify-between dark:bg-red-500/20">
            <div>
              <div className="text-xs text-muted-foreground">Low Stock</div>
              <div className="text-2xl font-semibold">{lowStockCount}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center dark:bg-red-500/30">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionButton 
            icon={<Plus className="mr-2 h-4 w-4" />}
            label="Add Material"
            onClick={() => navigate("/materials")}
            delay={0}
            visible={visible}
            variant="primary"
          />
          <ActionButton 
            icon={<ArrowDownUp className="mr-2 h-4 w-4" />}
            label="Record Usage"
            onClick={() => navigate("/batches")}
            delay={100}
            visible={visible}
            variant="amber"
          />
          <ActionButton 
            icon={<ClipboardList className="mr-2 h-4 w-4" />}
            label="View Inventory"
            onClick={() => navigate("/stock")}
            delay={200}
            visible={visible}
            variant="blue"
          />
          <ActionButton 
            icon={<BarChart3 className="mr-2 h-4 w-4" />}
            label="Usage Log"
            onClick={() => navigate("/usage-log")}
            delay={300}
            visible={visible}
            variant="green"
          />
        </div>
      </CardContent>
    </Card>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  delay: number;
  visible: boolean;
  variant: 'primary' | 'amber' | 'blue' | 'green';
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, delay, visible, variant }) => {
  const variantStyles = {
    primary: "hover:bg-primary/10 hover:border-primary/20 dark:hover:bg-primary/20 dark:hover:border-primary/30",
    amber: "hover:bg-amber-500/10 hover:border-amber-500/20 dark:hover:bg-amber-500/20 dark:hover:border-amber-500/30",
    blue: "hover:bg-blue-500/10 hover:border-blue-500/20 dark:hover:bg-blue-500/20 dark:hover:border-blue-500/30",
    green: "hover:bg-green-500/10 hover:border-green-500/20 dark:hover:bg-green-500/20 dark:hover:border-green-500/30"
  };
  
  return (
    <Button
      variant="outline"
      className={cn(
        "h-14 w-full justify-start px-4 transition-all duration-500 opacity-0 transform translate-y-4 border shadow-sm hover:shadow-md",
        variantStyles[variant],
        visible && "opacity-100 translate-y-0"
      )}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
};

export default QuickActions;
