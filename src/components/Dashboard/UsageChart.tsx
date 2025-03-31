
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3 } from "lucide-react";

// Mock data - would come from Supabase in a real implementation
const mockUsageData = [
  { day: "Mon", usage: 65 },
  { day: "Tue", usage: 42 },
  { day: "Wed", usage: 78 },
  { day: "Thu", usage: 53 },
  { day: "Fri", usage: 89 },
  { day: "Sat", usage: 25 },
  { day: "Sun", usage: 15 },
];

const UsageChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API load with a delay
    const timer = setTimeout(() => {
      setData(mockUsageData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const [barAnimationActive, setBarAnimationActive] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setBarAnimationActive(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  return (
    <Card className="shadow-sm border-0 bg-white/95 backdrop-blur-sm dark:bg-gray-900/90 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Daily Material Usage
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
              margin={{ top: 20, right: 30, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 12 }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  padding: '8px 12px',
                }}
                cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
              />
              <Bar 
                dataKey="usage" 
                fill="rgba(59, 130, 246, 0.8)"
                radius={[6, 6, 0, 0]}
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

export default UsageChart;
