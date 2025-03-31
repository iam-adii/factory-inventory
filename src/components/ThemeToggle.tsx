
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function ThemeToggle({ variant = "outline" }: { variant?: "outline" | "ghost" }) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="icon" className="border-none">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="dark:bg-gray-950 dark:border-gray-800">
        <DropdownMenuItem onClick={() => {
          setTheme("light");
          toast.success("Light mode activated");
        }}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setTheme("dark");
          toast.success("Dark mode activated");
        }}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setTheme("system");
          toast.success("Using system preference");
        }}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
