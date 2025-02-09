
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
          <h4 className="font-medium mb-2">Headers</h4>
          <code className="block bg-muted p-2 rounded whitespace-pre">
            {`Content-Type: application/json
apikey: ${import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'your-supabase-anon-key'}`}
          </code>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Submit Data Request Body</h4>
          <code className="block bg-muted p-2 rounded whitespace-pre">
            {`{
  "agent_id": "string",           // Identifier for the AI agent
  "user_id": "string",           // Your unique identifier to associate data with a user
  "data_payload": object         // The data you want to store
}`}
          </code>
        </div>

        <div>
          <h4 className="font-medium mb-2">Retrieve Data Request Body</h4>
          <code className="block bg-muted p-2 rounded whitespace-pre">
            {`{
  "agent_id": "string",           // Identifier for the AI agent
  "user_id": "string",           // The user ID to retrieve data for
  "from_date": "ISO date string", // Optional: Filter data from this date
  "to_date": "ISO date string",   // Optional: Filter data to this date
  "limit": number,                // Optional: Maximum number of records to return
  "offset": number                // Optional: Number of records to skip
}`}
          </code>
        </div>

        <div>
          <h4 className="font-medium mb-2">Example Response</h4>
          <code className="block bg-muted p-2 rounded whitespace-pre">
            {`{
  "data": [
    {
      "id": "uuid",
      "agent_id": "string",
      "user_id": "string",
      "data_payload": object,
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "sync_status": "string"
    }
  ]
}`}
          </code>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Notes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>No authentication is required, but you must include the Supabase anon key in the apikey header</li>
            <li>Always provide a user_id to associate the data with a specific user</li>
            <li>The sync_status field indicates whether the data has been synced to OrbitDB</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default Documentation;
