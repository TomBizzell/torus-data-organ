
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface AIData {
  agent_id: string;
  data_payload: Json;
}

const AIDataHandler = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [session, setSession] = useState(null);
  const [agentId, setAgentId] = useState('test-agent');
  const [dataPayload, setDataPayload] = useState(JSON.stringify({ test: 'data' }, null, 2));
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

  const handleDataSubmission = async () => {
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit data.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    try {
      const payload = JSON.parse(dataPayload);
      setIsProcessing(true);
      
      const response = await supabase.functions.invoke('ai-data-receiver', {
        body: {
          agent_id: agentId,
          data_payload: payload,
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
        description: error instanceof SyntaxError ? "Invalid JSON payload" : "There was an error submitting the AI agent data.",
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
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">AI Data Handler</h2>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">API Documentation</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Endpoint</h4>
            <code className="block bg-muted p-2 rounded">
              POST https://lecahcsrnyquowhmxwer.functions.supabase.co/ai-data-receiver
            </code>
          </div>
          
          <div>
            <h4 className="font-medium">Headers</h4>
            <code className="block bg-muted p-2 rounded whitespace-pre">
              {`Authorization: Bearer <user-jwt-token>
Content-Type: application/json`}
            </code>
          </div>
          
          <div>
            <h4 className="font-medium">Request Body</h4>
            <code className="block bg-muted p-2 rounded whitespace-pre">
              {`{
  "agent_id": "string",
  "data_payload": object
}`}
            </code>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Test API</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="agentId" className="block text-sm font-medium mb-2">
              Agent ID
            </label>
            <input
              id="agentId"
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="dataPayload" className="block text-sm font-medium mb-2">
              Data Payload (JSON)
            </label>
            <Textarea
              id="dataPayload"
              value={dataPayload}
              onChange={(e) => setDataPayload(e.target.value)}
              className="font-mono"
              rows={8}
            />
          </div>

          <Button 
            onClick={handleDataSubmission}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Test Data Submission'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AIDataHandler;
