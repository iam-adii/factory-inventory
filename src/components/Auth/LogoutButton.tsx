import React from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const LogoutButton: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      title="Logout"
      className="text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
};

export default LogoutButton;