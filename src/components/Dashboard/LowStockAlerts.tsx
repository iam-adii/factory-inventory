
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { materialService } from "@/lib/services/materialService";
import { toast } from "@/hooks/use-toast";

interface Alert {
  id: number;
  material: string;
  currentStock: number;
  threshold: number;
  unit: string;
  severity: "low" | "medium" | "high";
}

const LowStockAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLowStockMaterials = async () => {
      try {
        const { data, error } = await materialService.getLowStock();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform the data to match our Alert interface
          const transformedAlerts = data.map(material => {
            // Calculate severity based on how far below threshold
            const ratio = material.current_stock / material.threshold;
            let severity: "low" | "medium" | "high" = "low";
            
            if (ratio < 0.5) {
              severity = "high";
            } else if (ratio < 0.8) {
              severity = "medium";
            }
            
            return {
              id: material.id,
              material: material.name,
              currentStock: material.current_stock,
              threshold: material.threshold,
              unit: material.unit,
              severity
            };
          });
          
          setAlerts(transformedAlerts);
        }
      } catch (error) {
        console.error('Error fetching low stock materials:', error);
        toast({
          variant: "destructive",
          title: "Failed to load alerts",
          description: "There was an error loading the low stock alerts."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockMaterials();
  }, []);

  return (
    <Card className="shadow-sm border-0 bg-white/95 backdrop-blur-sm dark:bg-gray-900/90">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Low Stock Alerts
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary"
            onClick={() => navigate("/stock")}
          >
            View All <ArrowRight className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <AlertSkeleton key={i} />
            ))}
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <AlertItem 
                key={alert.id} 
                alert={alert} 
                delay={index * 100} 
              />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            All stock levels are currently sufficient
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface AlertItemProps {
  alert: Alert;
  delay: number;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, delay }) => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const severityClasses = {
    high: "bg-red-50/60 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",
    medium: "bg-amber-50/60 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400",
    low: "bg-blue-50/60 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400",
  };

  const dotClasses = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-blue-500",
  };

  // Calculate percentage of stock relative to threshold
  const percentage = Math.round((alert.currentStock / alert.threshold) * 100);

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-all transform shadow-sm cursor-pointer hover:shadow-md",
        severityClasses[alert.severity],
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={() => navigate(`/stock?highlight=${alert.id}`)}
    >
      <div className="flex items-center">
        <div className={cn("h-2 w-2 rounded-full mr-2", dotClasses[alert.severity])}></div>
        <div className="flex-1">
          <div className="font-medium">{alert.material}</div>
          <div className="flex justify-between items-center mt-1">
            <div className="text-sm opacity-90">
              {alert.currentStock} / {alert.threshold} {alert.unit}
            </div>
            <div className="text-xs font-medium">
              {percentage}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 dark:bg-gray-700">
            <div 
              className={cn("h-1.5 rounded-full", dotClasses[alert.severity])} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertSkeleton = () => (
  <div className="p-3 rounded-lg border border-muted bg-muted/40 animate-pulse">
    <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-muted rounded w-1/2"></div>
  </div>
);

export default LowStockAlerts;
