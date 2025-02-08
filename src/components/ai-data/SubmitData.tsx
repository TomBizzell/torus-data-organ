
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const SubmitData = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentId, setAgentId] = useState('test-agent');
  const [dataPayload, setDataPayload] = useState(JSON.stringify({ test: 'data' }, null, 2));
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDataSubmission = async () => {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) {
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

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Submit AI Agent Data</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="submitAgentId">Agent ID</Label>
          <Input
            id="submitAgentId"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <Label htmlFor="dataPayload">Data Payload (JSON)</Label>
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
          {isProcessing ? 'Processing...' : 'Submit Data'}
        </Button>
      </div>
    </Card>
  );
};

export default SubmitData;
