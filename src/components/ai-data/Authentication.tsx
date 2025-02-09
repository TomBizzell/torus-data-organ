
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';

const Authentication = () => {
  const [userId, setUserId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    // Check if user ID exists in localStorage
    const storedUserId = localStorage.getItem('cheslin_user_id');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // Generate new UUID and store it
      const newUserId = uuidv4();
      localStorage.setItem('cheslin_user_id', newUserId);
      setUserId(newUserId);
    }
  }, []);

  const copyUserId = async () => {
    await navigator.clipboard.writeText(userId);
    toast({
      title: "User ID Copied",
      description: "Your user ID has been copied to your clipboard.",
    });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">User ID Guide</h3>
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Your User ID</h4>
          <p className="text-sm text-muted-foreground mb-2">
            This is your unique identifier for associating data with your account.
            Use this ID in your API requests to store and retrieve your data.
          </p>
          <div className="relative">
            <Input
              value={userId}
              readOnly
              className="font-mono text-xs pr-24"
            />
            <Button
              className="absolute top-0 right-0"
              variant="secondary"
              onClick={copyUserId}
            >
              Copy ID
            </Button>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Example cURL Request</h4>
          <code className="block bg-muted p-2 rounded text-xs whitespace-pre-wrap">
            {`curl -X POST \\
  'https://lecahcsrnyquowhmxwer.functions.supabase.co/ai-data-receiver' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: ${import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'your-supabase-anon-key'}' \\
  -d '{
  "agent_id": "test-agent",
  "user_id": "${userId}",
  "data_payload": {"test": "data"}
}'`}
          </code>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Notes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Your user ID is automatically generated and stored in your browser</li>
            <li>Use this ID consistently across all API requests to maintain data association</li>
            <li>The ID persists across sessions unless you clear your browser data</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default Authentication;
