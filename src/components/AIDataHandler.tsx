
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useNavigate } from 'react-router-dom';

interface AIData {
  agent_id: string;
  data_payload: Json;
}

const AIDataHandler = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [session, setSession] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDataSubmission = async (data: AIData) => {
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit data.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await supabase.functions.invoke('ai-data-receiver', {
        body: {
          agent_id: data.agent_id,
          data_payload: data.data_payload,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Data Submitted Successfully",
        description: "The AI agent data has been stored and queued for OrbitDB sync.",
      });
    } catch (error) {
      console.error('Error submitting data:', error);
      toast({
        title: "Error Submitting Data",
        description: "There was an error submitting the AI agent data.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Listen for real-time updates on sync status
  useEffect(() => {
    const channel = supabase
      .channel('ai-data-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_agent_data',
          filter: 'sync_status=eq.synced'
        },
        (payload) => {
          toast({
            title: "Data Synced",
            description: `Data with ID ${payload.new.id} has been synced to OrbitDB`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">AI Data Handler</h2>
      <Button 
        onClick={() => handleDataSubmission({
          agent_id: 'test-agent',
          data_payload: { test: 'data' } as Json
        })}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Test Data Submission'}
      </Button>
    </div>
  );
};

export default AIDataHandler;
