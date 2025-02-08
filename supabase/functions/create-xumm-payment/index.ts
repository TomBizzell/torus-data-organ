
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
    
    const xumm = new XummSdk(
      Deno.env.get('XUMM_API_KEY')!,
      Deno.env.get('XUMM_API_SECRET')!
    )

    // Create payment request
    const payload = await xumm.payload.create({
      txjson: {
        TransactionType: "Payment",
        Destination: "rKN4rLYTYr8jTSt9jt4YHwEyQ7G9UZvyLF", // Replace with your actual destination address
        Amount: {
          currency: "USD",
          value: amount.toString(),
          issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B" // Bitstamp's issuer address
        }
      }
    })

    console.log('Created XUMM payment request:', payload)

    return new Response(
      JSON.stringify({
        qrUrl: payload.next.always,
        paymentPointer: payload.uuid
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating XUMM payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
