
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
    console.log('Creating XUMM payment request with params:', { amount, user_id, return_url });

    // Convert amount to drops (1 XRP = 1,000,000 drops)
    // Ensure the amount is formatted correctly
    const amountInDrops = Math.round(parseFloat(amount) * 1_000_000).toString()
    console.log('Amount in drops:', amountInDrops)

    const xummApiKey = Deno.env.get('XUMM_API_KEY')
    const xummApiSecret = Deno.env.get('XUMM_API_SECRET')

    if (!xummApiKey || !xummApiSecret) {
      throw new Error('XUMM API credentials not configured')
    }

    console.log('Making request to XUMM API...');
    const xummApiUrl = 'https://xumm.app/api/v1/platform/payload'
    const response = await fetch(xummApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': xummApiKey,
        'X-API-Secret': xummApiSecret,
        'Accept': 'application/json'
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
      console.log('Parsed XUMM API response:', payload)
    } catch (e) {
      console.error('Failed to parse XUMM API response:', e)
      throw new Error(`Invalid response from XUMM API: ${responseText}`)
    }

    // Check for specific XUMM API error responses
    if (!response.ok) {
      console.error('XUMM API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        payload
      })
      
      let errorMessage = 'XUMM API Error'
      if (payload.error) {
        if (typeof payload.error === 'object') {
          errorMessage += `: ${JSON.stringify(payload.error)}`
        } else {
          errorMessage += `: ${payload.error}`
        }
      } else if (payload.message) {
        errorMessage += `: ${payload.message}`
      } else if (response.statusText) {
        errorMessage += `: ${response.statusText}`
      }
      
      throw new Error(errorMessage)
    }

    // Verify required response fields
    if (!payload?.next?.always) {
      console.error('Invalid XUMM API response structure:', payload)
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
      name: error.name,
      cause: error.cause
    })
    
    return new Response(
      JSON.stringify({ 
        error: `Error creating XUMM payment: ${error.message}`,
        details: error.stack,
        name: error.name
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
