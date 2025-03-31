
import { useState, useEffect } from "react";
import StockLevels from "@/components/Dashboard/StockLevels";
import UsageChart from "@/components/Dashboard/UsageChart";
import LowStockAlerts from "@/components/Dashboard/LowStockAlerts";
import QuickActions from "@/components/Dashboard/QuickActions";
import { Database, BarChart3, AlertCircle, Zap } from "lucide-react";
 
const Index = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container px-4 py-6 mx-auto max-w-7xl">
      <div className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center px-3 py-1 mb-2 text-xs font-medium text-primary bg-primary/10 rounded-full">
              DASHBOARD
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Factory Inventory Overview</h1>
            <p className="mt-1 text-muted-foreground">
              Monitor stock levels, daily usage, and alerts at a glance
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <Database className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {/* Low Stock Alerts - Full width at the top */}
          <div className="w-full">
            <div className="p-1 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 dark:from-amber-500/10 dark:to-amber-500/5">
              <LowStockAlerts />
            </div>
          </div>
          
          {/* Quick Actions - Full width linear arrangement */}
          <div className="w-full">
            <div className="p-1 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 dark:from-green-500/10 dark:to-green-500/5">
              <QuickActions />
            </div>
          </div>
          
          {/* Stock Levels and Usage Chart - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full">
            <div className="md:col-span-4">
              <div className="p-1 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/10 dark:to-primary/5 h-full">
                <StockLevels />
              </div>
            </div>
            <div className="md:col-span-8">
              <div className="p-1 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 dark:from-blue-500/10 dark:to-cyan-500/5 h-full">
                <UsageChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
