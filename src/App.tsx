
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Index from "./pages/Index";
import Materials from "./pages/Materials";
import Stock from "./pages/Stock";
import Batches from "./pages/Batches";
import UsageLog from "./pages/UsageLog";
import MaterialsLog from "./pages/MaterialsLog";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import FloatingButton from "./components/FloatingButton";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="inventory-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <ProtectedRoute>
              <Navbar />
              <div className="pt-16">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/materials" element={<Materials />} />
                  <Route path="/stock" element={<Stock />} />
                  <Route path="/batches" element={<Batches />} />
                  <Route path="/usage-log" element={<UsageLog />} />
                  <Route path="/materials-log" element={<MaterialsLog />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <FloatingButton />
              </div>
            </ProtectedRoute>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
