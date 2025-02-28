
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AIDataHandler from "@/components/AIDataHandler";
import CryptoDonation from "@/components/CryptoDonation";
import { Boxes } from "lucide-react";

const Index = () => {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/30">
        <div className="max-w-2xl mx-auto text-center space-y-6 p-8">
          <div className="flex justify-center mb-8">
            <div className="p-3 bg-primary/5 rounded-2xl">
              <Boxes className="w-16 h-16 text-primary" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Cheslin
            </h1>
            <h2 className="text-3xl font-semibold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              Hybrid-distributed data storage
            </h2>
            <h3 className="text-2xl font-medium tracking-tight bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
              for Torus Agents
            </h3>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              An API to write to and retrieve from a supabase database, which periodically backs itself up onto a decentralised database using OrbitDB. This ensures speed, decentralization and security.
            </p>
          </div>
          <div className="pt-4">
            <Button size="lg" className="font-medium" asChild>
              <Link to="/auth">Connect with XRPL</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-xl">
              <Boxes className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Cheslin
              </h1>
              <h2 className="text-sm font-medium bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                Hybrid-distributed data storage for Torus Agents
              </h2>
              <p className="text-xs text-muted-foreground">
                An API to write to and retrieve from a supabase database, which periodically backs itself up onto a decentralised database using OrbitDB. This ensures speed, decentralization and security.
              </p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
        <AIDataHandler />
        <CryptoDonation />
      </div>
    </div>
  );
};

export default Index;
