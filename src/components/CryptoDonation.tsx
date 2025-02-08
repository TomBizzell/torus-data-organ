
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Client, Wallet, Payment } from "xrpl";

const DONATION_RECIPIENT = "0xd94c2621FBEC057d942aDAAE4E8364838315E8d9";
const DONATION_AMOUNT = 5; // RLUSD amount as number

const CryptoDonation = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleDonation = async () => {
    let client: Client | null = null;
    
    try {
      setIsProcessing(true);
      
      // Connect to XRPL testnet
      client = new Client("wss://s.altnet.rippletest.net:51233");
      await client.connect();

      // Get user's connected wallet
      // Note: This is a simplified example. In a real app, you'd need to handle wallet connection first
      const wallet = Wallet.generate();
      
      // Prepare payment transaction
      const payment: Payment = {
        TransactionType: "Payment",
        Account: wallet.address,
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
      const signed = wallet.sign(prepared);
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
      <Button 
        onClick={handleDonation} 
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Donate ${DONATION_AMOUNT} RLUSD`}
      </Button>
    </div>
  );
};

export default CryptoDonation;
