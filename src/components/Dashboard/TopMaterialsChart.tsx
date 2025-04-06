import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3 } from "lucide-react";
import { usageLogService } from "@/lib/services/usageLogService";
import { toast } from "@/hooks/use-toast";

interface MaterialUsage {
  name: string;
  total: number;
  unit: string;
}

const TopMaterialsChart = () => {
  const [data, setData] = useState<MaterialUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [barAnimationActive, setBarAnimationActive] = useState(false);

  useEffect(() => {
    const fetchTopMaterials = async () => {
      try {
        const { data: usageLogs, error } = await usageLogService.getAll();
        
        if (error) throw error;
        
        if (usageLogs) {
          // Aggregate usage by material
          const materialUsage = usageLogs.reduce((acc, log) => {
            const materialName = log.materials?.name || 'Unknown';
            const materialUnit = log.materials?.unit || 'units';
            const quantity = log.quantity || 0;
            
            if (!acc[materialName]) {
              acc[materialName] = { total: 0, unit: materialUnit };
            }
            acc[materialName].total += quantity;
            return acc;
          }, {} as Record<string, { total: number; unit: string }>);
          
          // Convert to array and sort by total usage
          const sortedMaterials = Object.entries(materialUsage)
            .map(([name, { total, unit }]) => ({ name, total, unit }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5); // Get top 5
          
          setData(sortedMaterials);
        }
      } catch (error) {
        console.error('Error fetching usage data:', error);
        toast({
          variant: "destructive",
          title: "Failed to load usage data",
          description: "There was an error loading the material usage data."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTopMaterials();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setBarAnimationActive(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-gray-800/95 p-2 rounded-lg shadow-lg border border-border">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.total} {data.unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-sm border-0 bg-white/95 backdrop-blur-sm dark:bg-gray-900/90 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Top 5 Used Materials
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 h-[300px]">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis 
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 12 }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="total"
                fill="rgba(var(--primary), 0.8)"
                radius={[0, 6, 6, 0]}
                animationDuration={1500}
                animationBegin={0}
                isAnimationActive={barAnimationActive}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TopMaterialsChart;