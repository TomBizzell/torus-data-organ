
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AIData {
  agent_id: string;
  data_payload: Json;
}

const AIDataHandler = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [session, setSession] = useState(null);
  const [agentId, setAgentId] = useState('test-agent');
  const [dataPayload, setDataPayload] = useState(JSON.stringify({ test: 'data' }, null, 2));
  const [authToken, setAuthToken] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.access_token) {
        setAuthToken(session.access_token);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.access_token) {
        setAuthToken(session.access_token);
      }
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
      
      <Tabs defaultValue="docs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="docs">Documentation</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="test">Test API</TabsTrigger>
        </TabsList>

        <TabsContent value="docs">
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
        </TabsContent>

        <TabsContent value="auth">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Authentication Guide</h3>
            <div className="space-y-4">
              {!session ? (
                <div>
                  <p className="text-muted-foreground mb-4">
                    Please sign in to get your authentication token.
                  </p>
                  <Button onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="font-medium mb-2">Your JWT Token</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Use this token in your Authorization header when making API requests.
                      This token will refresh automatically when you're logged in.
                    </p>
                    <div className="relative">
                      <Textarea
                        value={authToken}
                        readOnly
                        className="font-mono text-xs h-24"
                      />
                      <Button
                        className="absolute top-2 right-2"
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(authToken);
                          toast({
                            title: "Token Copied",
                            description: "The JWT token has been copied to your clipboard.",
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Example cURL Request</h4>
                    <code className="block bg-muted p-2 rounded text-xs whitespace-pre-wrap">
                      {`curl -X POST \\
  'https://lecahcsrnyquowhmxwer.functions.supabase.co/ai-data-receiver' \\
  -H 'Authorization: Bearer ${authToken}' \\
  -H 'Content-Type: application/json' \\
  -d '{"agent_id": "test-agent", "data_payload": {"test": "data"}}'`}
                    </code>
                  </div>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="test">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIDataHandler;
