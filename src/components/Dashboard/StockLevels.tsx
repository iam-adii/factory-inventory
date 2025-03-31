
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Package2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { materialService } from "@/lib/services/materialService";
import { toast } from "@/hooks/use-toast";

interface StockData {
  id: number;
  name: string;
  currentStock: number;
  maxStock: number;
  unit: string;
}

const StockLevels = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data, error } = await materialService.getAll();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform the data to match our StockData interface
          const transformedStocks = data.map(material => ({
            id: material.id,
            name: material.name,
            currentStock: material.current_stock,
            maxStock: material.threshold,
            unit: material.unit
          }));
          
          setStocks(transformedStocks);
          
          // Set the last updated time
          if (data.length > 0) {
            const mostRecentUpdate = new Date(Math.max(
              ...data.map(m => new Date(m.last_updated).getTime())
            ));
            
            // Format the date to a readable string
            const timeAgo = getTimeAgo(mostRecentUpdate);
            setLastUpdated(timeAgo);
          }
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
        toast({
          variant: "destructive",
          title: "Failed to load stock data",
          description: "There was an error loading the stock level data."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);
  
  // Helper function to format the time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <Card className="shadow-sm border-0 bg-white/95 backdrop-blur-sm dark:bg-gray-900/90 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-primary" />
            Current Stock Levels
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-normal">
              Updated {lastUpdated}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary"
              onClick={() => navigate("/stock")}
            >
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <StockSkeleton key={i} />
            ))}
          </div>
        ) : stocks.length > 0 ? (
          <div className="space-y-4">
            {stocks
              .sort((a, b) => (a.currentStock / a.maxStock) - (b.currentStock / b.maxStock))
              .slice(0, 5)
              .map((stock) => (
                <StockItem key={stock.id} stock={stock} />
              ))}
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            No stock data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface StockItemProps {
  stock: {
    id: number;
    name: string;
    currentStock: number;
    maxStock: number;
    unit: string;
  };
}

const StockItem: React.FC<StockItemProps> = ({ stock }) => {
  const [showProgress, setShowProgress] = useState(false);
  const percentage = Math.round((stock.currentStock / stock.maxStock) * 100);
  const navigate = useNavigate();
  
  let progressColor = "bg-primary";
  if (percentage < 20) progressColor = "bg-destructive";
  else if (percentage < 40) progressColor = "bg-amber-500";

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowProgress(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="animate-fade-in cursor-pointer hover:bg-muted/20 p-2 -mx-2 rounded-md transition-colors"
      onClick={() => navigate(`/stock?highlight=${stock.id}`)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium">{stock.name}</span>
        <span className="text-sm text-muted-foreground">
          {stock.currentStock} / {stock.maxStock} {stock.unit}
        </span>
      </div>
      <Progress 
        value={showProgress ? percentage : 0} 
        className={`h-2.5 transition-all duration-1000 ease-out rounded-full ${progressColor}`}
      />
    </div>
  );
};

const StockSkeleton = () => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <div className="h-5 bg-muted rounded animate-pulse w-1/3"></div>
      <div className="h-4 bg-muted rounded animate-pulse w-1/4"></div>
    </div>
    <div className="h-2.5 bg-muted rounded-full animate-pulse"></div>
  </div>
);

export default StockLevels;
