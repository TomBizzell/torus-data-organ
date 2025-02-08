
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Authentication = () => {
  const [session, setSession] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.access_token) {
        setAuthToken(session.access_token);
      }
    });

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

  return (
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
  );
};

export default Authentication;
