import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const PinEntry: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { authenticate } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Simulate a slight delay for better UX
    setTimeout(() => {
      const isValid = authenticate(pin);
      
      if (!isValid) {
        setError('Invalid PIN. Please try again.');
        toast({
          title: "Authentication Failed",
          description: "The PIN you entered is incorrect.",
          variant: "destructive"
        });
      }
      
      setLoading(false);
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg animate-in fade-in-50 duration-300">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Inventory Management</CardTitle>
          <p className="text-sm text-muted-foreground">Enter PIN to access the system</p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className={error ? "border-red-500" : ""}
                maxLength={4}
                autoFocus
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || pin.length < 4}>
              {loading ? "Verifying..." : "Access System"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default PinEntry;