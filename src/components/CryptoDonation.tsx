
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    core?: {
      connect(): Promise<{ address: string }>;
      requestSignature(transaction: any): Promise<{ hash: string }>;
    }
  }
}

const DONATION_RECIPIENT = "0xd94c2621FBEC057d942aDAAE4E8364838315E8d9";
const DONATION_AMOUNT = 5; // RLUSD amount as number

const CryptoDonation = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<{ address: string } | null>(null);
  const { toast } = useToast();

  const connectWallet = async () => {
    if (typeof window.core === 'undefined') {
      toast({
        title: "Wallet Not Found",
        description: "Please install Core Wallet extension to continue.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Request wallet connection
      const response = await window.core.connect();
      
      if (response.address) {
        setConnectedWallet({ address: response.address });
        toast({
          title: "Wallet Connected",
          description: `Connected to wallet: ${response.address.slice(0, 6)}...${response.address.slice(-4)}`,
        });
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDonation = async () => {
    if (typeof window.core === 'undefined') {
      toast({
        title: "Wallet Not Found",
        description: "Please install Core Wallet extension to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!connectedWallet) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Create payment transaction
      const txnRequest = {
        type: "Payment",
        from: connectedWallet.address,
        to: DONATION_RECIPIENT,
        amount: {
          currency: "USD",
          value: DONATION_AMOUNT.toString(),
          issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B" // Bitstamp's issuer address for USD
        }
      };

      // Request signature and submission
      const response = await window.core.requestSignature(txnRequest);

      if (response.hash) {
        // Get the current user's ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Record donation in database
        const { error: dbError } = await supabase.from('donations').insert({
          amount: DONATION_AMOUNT,
          transaction_hash: response.hash,
          user_id: user.id
        });

        if (dbError) throw dbError;

        toast({
          title: "Donation Successful",
          description: `Thank you for your ${DONATION_AMOUNT} RLUSD donation!`,
        });
      }
    } catch (error) {
      console.error('Donation error:', error);
      toast({
        title: "Donation Failed",
        description: "There was an error processing your donation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-8 p-6 bg-card rounded-lg border shadow-sm">
      <h3 className="text-xl font-semibold mb-4">Support the Project</h3>
      <p className="text-muted-foreground mb-4">
        Help us maintain and improve Cheslin by making a donation of {DONATION_AMOUNT} RLUSD.
      </p>
      {!connectedWallet ? (
        <Button 
          onClick={connectWallet} 
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </Button>
      ) : (
        <Button 
          onClick={handleDonation} 
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Donate ${DONATION_AMOUNT} RLUSD`
          )}
        </Button>
      )}
      {connectedWallet && (
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Connected: {connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}
        </p>
      )}
    </div>
  );
};

export default CryptoDonation;
