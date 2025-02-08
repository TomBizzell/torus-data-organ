
import { Card } from "@/components/ui/card";

const Documentation = () => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">API Documentation</h3>
      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-2">Submit Data Endpoint</h4>
          <code className="block bg-muted p-2 rounded">
            POST https://lecahcsrnyquowhmxwer.functions.supabase.co/ai-data-receiver
          </code>
        </div>

        <div>
          <h4 className="font-medium mb-2">Retrieve Data Endpoint</h4>
          <code className="block bg-muted p-2 rounded">
            POST https://lecahcsrnyquowhmxwer.functions.supabase.co/ai-data-retriever
          </code>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Headers (Both Endpoints)</h4>
          <code className="block bg-muted p-2 rounded whitespace-pre">
            {`Authorization: Bearer <user-jwt-token>
Content-Type: application/json`}
          </code>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Submit Data Request Body</h4>
          <code className="block bg-muted p-2 rounded whitespace-pre">
            {`{
  "agent_id": "string",
  "data_payload": object
}`}
          </code>
        </div>

        <div>
          <h4 className="font-medium mb-2">Retrieve Data Request Body</h4>
          <code className="block bg-muted p-2 rounded whitespace-pre">
            {`{
  "agent_id": "string",
  "from_date": "ISO date string (optional)",
  "to_date": "ISO date string (optional)",
  "limit": number (optional),
  "offset": number (optional)
}`}
          </code>
        </div>
      </div>
    </Card>
  );
};

export default Documentation;
