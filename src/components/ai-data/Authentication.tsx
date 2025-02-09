
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { nanoid } from 'nanoid';

const Authentication = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const { toast } = useToast();
  const userId = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlY2FoY3NybnlxdW93aG14d2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwNDc2MTQsImV4cCI6MjA1NDYyMzYxNH0.idjB3qiJUjjWCS7AOI-qSK3YXwqppXArtlg6wm3K0Xo";

  useEffect(() => {
    // Generate new API key if not exists
    const storedApiKey = localStorage.getItem('cheslin_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      // Generate new ID using nanoid
      const newApiKey = nanoid();
      localStorage.setItem('cheslin_api_key', newApiKey);
      setApiKey(newApiKey);
    }
  }, []);

  const copyApiKey = async () => {
    await navigator.clipboard.writeText(apiKey);
    toast({
      title: "API Key Copied",
      description: "Your API key has been copied to your clipboard.",
    });
  };

  const copyUserId = async () => {
    await navigator.clipboard.writeText(userId);
    toast({
      title: "User ID Copied",
      description: "The user ID has been copied to your clipboard.",
    });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Authentication Guide</h3>
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Your API Key</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Use this API key in the 'apikey' header for all your requests.
          </p>
          <div className="relative">
            <Input
              value={apiKey}
              readOnly
              className="font-mono text-xs pr-24"
            />
            <Button
              className="absolute top-0 right-0"
              variant="secondary"
              onClick={copyApiKey}
            >
              Copy Key
            </Button>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">User ID</h4>
          <p className="text-sm text-muted-foreground mb-2">
            This is the user ID to use in your API requests to store and retrieve your data.
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
  -H 'apikey: ${apiKey}' \\
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
            <li>Your API key is automatically generated and stored in your browser</li>
            <li>The User ID is a fixed value you should use across all API requests</li>
            <li>Include both the API key in the 'apikey' header and the User ID in the request body</li>
            <li>The API key persists across sessions unless you clear your browser data</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default Authentication;
