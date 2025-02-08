
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDID, verifyDID } from '@/lib/xrpl-did';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

const XRPLAuth = () => {
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create DID from seed
      const { did, address } = await createDID(seed);
      
      // Verify DID
      const isValid = await verifyDID(did);
      
      if (!isValid) {
        toast({
          title: "Invalid XRPL Account",
          description: "Please check your seed and try again.",
          variant: "destructive"
        });
        return;
      }

      // Sign up with Supabase using DID as email (since we need an email format)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${address}@xrpl.did`,
        password: did, // Using DID as password, since we need one
      });

      if (authError) {
        // If user exists, try to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: `${address}@xrpl.did`,
          password: did,
        });

        if (signInError) {
          throw signInError;
        }
      }

      // Update or create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData?.user?.id,
          did: did,
          verification_status: true
        });

      if (profileError) {
        throw profileError;
      }

      toast({
        title: "Authentication Successful",
        description: "You have been successfully authenticated with your XRPL DID.",
      });

      navigate('/');
      
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Failed",
        description: "An error occurred during authentication. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">XRPL DID Authentication</h1>
          <p className="text-muted-foreground mt-2">
            Authenticate using your XRPL account seed
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter your XRPL account seed"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              required
              className="w-full"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Authenticate with XRPL"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default XRPLAuth;
