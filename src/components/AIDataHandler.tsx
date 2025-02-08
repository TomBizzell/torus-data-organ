
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Documentation from './ai-data/Documentation';
import Authentication from './ai-data/Authentication';
import SubmitData from './ai-data/SubmitData';
import RetrieveData from './ai-data/RetrieveData';

const AIDataHandler = () => {
  const { toast } = useToast();

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="docs">Documentation</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="submit">Submit Data</TabsTrigger>
          <TabsTrigger value="retrieve">Retrieve Data</TabsTrigger>
        </TabsList>

        <TabsContent value="docs">
          <Documentation />
        </TabsContent>

        <TabsContent value="auth">
          <Authentication />
        </TabsContent>

        <TabsContent value="submit">
          <SubmitData />
        </TabsContent>

        <TabsContent value="retrieve">
          <RetrieveData />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIDataHandler;
