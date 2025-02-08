
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const RetrieveData = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentId, setAgentId] = useState('test-agent');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [limit, setLimit] = useState('10');
  const [retrievedData, setRetrievedData] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDataRetrieval = async () => {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to retrieve data.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    try {
      setIsProcessing(true);
      
      const response = await supabase.functions.invoke('ai-data-retriever', {
        body: {
          agent_id: agentId,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          limit: limit ? parseInt(limit) : undefined,
        },
      });

      if (response.error) throw response.error;

      setRetrievedData(response.data.data);
      
      toast({
        title: "Data Retrieved Successfully",
        description: `Retrieved ${response.data.data.length} records.`,
      });
    } catch (error) {
      console.error('Error retrieving data:', error);
      toast({
        title: "Error Retrieving Data",
        description: "There was an error retrieving the AI agent data.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Retrieve AI Agent Data</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="retrieveAgentId">Agent ID</Label>
          <Input
            id="retrieveAgentId"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fromDate">From Date</Label>
            <Input
              id="fromDate"
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="toDate">To Date</Label>
            <Input
              id="toDate"
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="limit">Limit Results</Label>
          <Input
            id="limit"
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full"
            min="1"
            max="100"
          />
        </div>

        <Button 
          onClick={handleDataRetrieval}
          disabled={isProcessing}
          className="w-full mb-4"
        >
          {isProcessing ? 'Processing...' : 'Retrieve Data'}
        </Button>

        {retrievedData.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Retrieved Data</h4>
            <pre className="bg-muted p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(retrievedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RetrieveData;
