
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIData {
  agent_id: string;
  data_payload: object;
}

const AIDataHandler = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleDataSubmission = async (data: AIData) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('ai_agent_data')
        .insert({
          agent_id: data.agent_id,
          data_payload: data.data_payload,
          sync_status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Data Stored Successfully",
        description: "The AI agent data has been stored and queued for OrbitDB sync.",
      });
    } catch (error) {
      console.error('Error storing data:', error);
      toast({
        title: "Error Storing Data",
        description: "There was an error storing the AI agent data.",
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
      {/* This is a placeholder component. In practice, this would be 
          integrated with your API endpoint and receive data automatically */}
      <Button 
        onClick={() => handleDataSubmission({
          agent_id: 'test-agent',
          data_payload: { test: 'data' }
        })}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Test Data Submission'}
      </Button>
    </div>
  );
};

export default AIDataHandler;
