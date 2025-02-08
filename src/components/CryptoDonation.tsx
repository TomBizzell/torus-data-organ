
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const DONATION_AMOUNT = 5; // RLUSD amount as number

const CryptoDonation = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentPointer, setPaymentPointer] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDonation = async () => {
    try {
      setIsProcessing(true);
      
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to make a donation.",
          variant: "destructive"
        });
        return;
      }

      // Create payment request using Edge Function
      const { data, error } = await supabase.functions.invoke('create-xumm-payment', {
        body: {
          amount: DONATION_AMOUNT,
          user_id: user.id
        },
      });

      if (error) throw error;

      if (data?.qrUrl) {
        // Open XUMM app or show QR code
        window.open(data.qrUrl, '_blank');
        setPaymentPointer(data.paymentPointer);
        
        // Start polling for payment status
        const checkPayment = setInterval(async () => {
          const { data: status, error: statusError } = await supabase.functions.invoke('check-xumm-payment', {
            body: { 
              paymentPointer: data.paymentPointer 
            },
          });
          
          if (statusError) {
            clearInterval(checkPayment);
            throw statusError;
          }

          if (status?.expired) {
            clearInterval(checkPayment);
            setPaymentPointer(null);
            toast({
              title: "Payment Expired",
              description: "The payment request has expired. Please try again.",
              variant: "destructive"
            });
          }

          if (status?.completed) {
            clearInterval(checkPayment);
            setPaymentPointer(null);
            toast({
              title: "Donation Successful",
              description: `Thank you for your ${DONATION_AMOUNT} RLUSD donation!`,
            });
          }
        }, 3000);

        // Clear interval after 5 minutes (maximum XUMM expiration time)
        setTimeout(() => {
          clearInterval(checkPayment);
          setPaymentPointer(null);
        }, 300000);
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
      <Button 
        onClick={handleDonation} 
        disabled={isProcessing || !!paymentPointer}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : paymentPointer ? (
          'Waiting for payment...'
        ) : (
          `Donate ${DONATION_AMOUNT} RLUSD`
        )}
      </Button>
      {paymentPointer && (
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Please complete the payment in your XUMM wallet
        </p>
      )}
    </div>
  );
};

export default CryptoDonation;
