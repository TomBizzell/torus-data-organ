
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { XummSdk } from 'https://esm.sh/xumm-sdk@1.8.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { amount, user_id } = await req.json()
    console.log('Creating XUMM payment request for amount:', amount)
    
    const xumm = new XummSdk(
      Deno.env.get('XUMM_API_KEY')!,
      Deno.env.get('XUMM_API_SECRET')!
    )

    // Format amount as proper string (XUMM expects string amounts)
    const formattedAmount = amount.toFixed(2)

    // Create payment request with proper transaction format
    const payload = await xumm.payload.create({
      txjson: {
        TransactionType: "Payment",
        Destination: "rKN4rLYTYr8jTSt9jt4YHwEyQ7G9UZvyLF",
        Amount: {
          currency: "USD",
          value: formattedAmount,
          issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      options: {
        submit: true,
        expire: 5 * 60, // 5 minutes
        return_url: {
          web: window.location.origin
        }
      }
    })

    console.log('XUMM payment request response:', payload)

    if (!payload?.next?.always) {
      throw new Error('Invalid response from XUMM API - missing QR URL')
    }

    return new Response(
      JSON.stringify({
        qrUrl: payload.next.always,
        paymentPointer: payload.uuid
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Detailed error creating XUMM payment:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        error: `Error creating XUMM payment: ${error.message}`,
        details: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
