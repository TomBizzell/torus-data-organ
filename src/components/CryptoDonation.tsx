
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Xumm } from 'xumm';

const DONATION_RECIPIENT = "0xd94c2621FBEC057d942aDAAE4E8364838315E8d9";
const DONATION_AMOUNT = 5; // RLUSD amount as number

const CryptoDonation = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<{ address: string } | null>(null);
  const [xummSDK, setXummSDK] = useState<Xumm | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeXumm = async () => {
      try {
        const { data: { secret: apiKey }, error } = await supabase.functions.invoke('get-xumm-api-key');
        
        if (error || !apiKey) {
          console.error('Error fetching XUMM API key:', error);
          return;
        }

        const sdk = new Xumm(apiKey);
        setXummSDK(sdk);
      } catch (error) {
        console.error('Error initializing XUMM SDK:', error);
      }
    };

    initializeXumm();
  }, []);

  const connectWallet = async () => {
    if (!xummSDK) {
      toast({
        title: "Error",
        description: "XUMM SDK not initialized. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Create a sign request to connect the wallet
      const request = await xummSDK.authorize();
      
      // Open XUMM app or show QR code
      window.open(request.next.always, '_blank');

      // Wait for the user to scan and approve
      const result = await request.websocket.resolved;
      
      if (result && result.account) {
        setConnectedWallet({ address: result.account });
        toast({
          title: "Wallet Connected",
          description: `Connected to wallet: ${result.account.slice(0, 6)}...${result.account.slice(-4)}`,
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
    if (!xummSDK) {
      toast({
        title: "Error",
        description: "XUMM SDK not initialized. Please try again.",
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
      
      // Create a payment transaction request
      const request = await xummSDK.payload.createAndSubscribe({
        TransactionType: "Payment",
        Account: connectedWallet.address,
        Destination: DONATION_RECIPIENT,
        Amount: {
          currency: "USD",
          value: DONATION_AMOUNT.toString(),
          issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B" // Bitstamp's issuer address for USD
        },
        Flags: 0
      });

      // Open XUMM app or show QR code for payment
      window.open(request.created.next.always, '_blank');

      // Wait for the transaction to be signed and submitted
      const result = await request.resolved;

      if (result && result.txid) {
        // Get the current user's ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Record donation in database
        const { error: dbError } = await supabase.from('donations').insert({
          amount: DONATION_AMOUNT,
          transaction_hash: result.txid,
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
          disabled={isProcessing || !xummSDK}
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
