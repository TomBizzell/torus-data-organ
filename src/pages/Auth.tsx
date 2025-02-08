
import { useState } from "react";
import XRPLAuth from "@/components/XRPLAuth";
import EmailAuth from "@/components/EmailAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Authentication</h1>
          <p className="text-muted-foreground mt-2">
            Choose your preferred authentication method
          </p>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="xrpl">XRPL</TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <EmailAuth />
          </TabsContent>
          <TabsContent value="xrpl">
            <XRPLAuth />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
