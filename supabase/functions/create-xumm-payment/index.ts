
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
    const { amount, user_id, return_url } = await req.json()
    console.log('Creating XUMM payment request for amount:', amount)

    // Convert amount to drops (1 XRP = 1,000,000 drops)
    // Ensure the amount is formatted correctly
    const amountInDrops = Math.round(parseFloat(amount) * 1_000_000).toString()
    console.log('Amount in drops:', amountInDrops)

    const xummApiKey = Deno.env.get('XUMM_API_KEY')
    const xummApiSecret = Deno.env.get('XUMM_API_SECRET')

    if (!xummApiKey || !xummApiSecret) {
      throw new Error('XUMM API credentials not configured')
    }

    const xummApiUrl = 'https://xumm.app/api/v1/platform/payload'
    const response = await fetch(xummApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': xummApiKey,
        'X-API-Secret': xummApiSecret
      },
      body: JSON.stringify({
        txjson: {
          TransactionType: "Payment",
          Destination: "rKN4rLYTYr8jTSt9jt4YHwEyQ7G9UZvyLF",
          Amount: amountInDrops,
          Fee: "12"
        },
        options: {
          submit: true,
          expire: 5 * 60, // 5 minutes
          return_url: {
            web: return_url
          }
        },
        user_token: user_id
      })
    });

    const responseText = await response.text()
    console.log('XUMM API raw response:', responseText)

    let payload
    try {
      payload = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse XUMM API response:', e)
      throw new Error(`Invalid response from XUMM API: ${responseText}`)
    }

    if (!response.ok) {
      console.error('XUMM API Error Details:', payload)
      throw new Error(`XUMM API Error: ${payload.error?.reference || payload.message || response.statusText}`)
    }

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
