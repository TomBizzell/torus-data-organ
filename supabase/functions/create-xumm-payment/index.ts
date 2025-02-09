
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    // Format amount as proper string (XUMM expects string amounts)
    const formattedAmount = amount.toString()

    const xummApiUrl = 'https://xumm.app/api/v1/platform/payload'
    const response = await fetch(xummApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': Deno.env.get('XUMM_API_KEY')!,
        'X-API-Secret': Deno.env.get('XUMM_API_SECRET')!
      },
      body: JSON.stringify({
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
          expire: 5 * 60 // 5 minutes
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json()
      console.error('XUMM API Error Details:', errorData)
      throw new Error(`XUMM API Error: ${errorData.error?.reference || errorData.message || response.statusText}`)
    }

    const payload = await response.json()
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
