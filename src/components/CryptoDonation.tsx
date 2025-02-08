
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Client, Wallet, Payment } from "xrpl";
import { Loader2 } from "lucide-react";

const DONATION_RECIPIENT = "0xd94c2621FBEC057d942aDAAE4E8364838315E8d9";
const DONATION_AMOUNT = 5; // RLUSD amount as number

const CryptoDonation = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<Wallet | null>(null);
  const { toast } = useToast();

  const connectWallet = async () => {
    try {
      setIsProcessing(true);
      
      // In a real implementation, you would integrate with a wallet provider
      // For demo purposes, we're generating a test wallet
      const testWallet = Wallet.generate();
      setConnectedWallet(testWallet);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to wallet: ${testWallet.address.slice(0, 6)}...${testWallet.address.slice(-4)}`,
      });
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
    if (!connectedWallet) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first.",
        variant: "destructive"
      });
      return;
    }

    let client: Client | null = null;
    
    try {
      setIsProcessing(true);
      
      // Connect to XRPL testnet
      client = new Client("wss://s.altnet.rippletest.net:51233");
      await client.connect();
      
      // Prepare payment transaction
      const payment: Payment = {
        TransactionType: "Payment",
        Account: connectedWallet.address,
        Destination: DONATION_RECIPIENT,
        Amount: {
          currency: "USD",
          value: DONATION_AMOUNT.toString(),
          issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B" // Bitstamp's issuer address for USD
        },
        Flags: 0
      };

      // Sign and submit transaction
      const prepared = await client.autofill(payment);
      const signed = connectedWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Record donation in database
      const { error: dbError } = await supabase.from('donations').insert({
        amount: DONATION_AMOUNT,
        transaction_hash: result.result.hash,
        user_id: user.id
      });

      if (dbError) throw dbError;

      toast({
        title: "Donation Successful",
        description: `Thank you for your ${DONATION_AMOUNT} RLUSD donation!`,
      });

    } catch (error) {
      console.error('Donation error:', error);
      toast({
        title: "Donation Failed",
        description: "There was an error processing your donation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      // Close connection
      if (client) {
        await client.disconnect();
      }
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
