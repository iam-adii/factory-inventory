
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Beaker, Database, Package2, FileText } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300", 
        scrolled 
          ? "bg-white/80 backdrop-blur-md border-b shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link 
          to="/" 
          className="flex items-center space-x-2 font-semibold text-xl"
        >
          <Database className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline-block">StockFlow</span>
        </Link>

        <nav className="flex items-center space-x-1">
          <NavItem 
            to="/" 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            isActive={isActive("/")} 
          />
          <NavItem 
            to="/materials" 
            icon={<Beaker size={18} />} 
            label="Materials" 
            isActive={isActive("/materials")} 
          />
          <NavItem 
            to="/stock" 
            icon={<Package2 size={18} />} 
            label="Stock" 
            isActive={isActive("/stock")} 
          />
          <NavItem 
            to="/usage-log" 
            icon={<FileText size={18} />} 
            label="Usage Log" 
            isActive={isActive("/usage-log")} 
          />
          <NavItem 
            to="/batches" 
            icon={<Database size={18} />} 
            label="Batches" 
            isActive={isActive("/batches")} 
          />
        </nav>
      </div>
    </header>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center space-x-1 px-3 py-2 rounded-md transition-all",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {icon}
      <span className="hidden sm:inline-block">{label}</span>
    </Link>
  );
};

export default Navbar;
