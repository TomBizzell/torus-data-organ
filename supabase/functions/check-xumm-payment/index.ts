
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { XummSdk } from 'https://esm.sh/xumm-sdk@1.8.6'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1'

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
    const { paymentPointer } = await req.json()
    
    const xumm = new XummSdk(
      Deno.env.get('XUMM_API_KEY')!,
      Deno.env.get('XUMM_API_SECRET')!
    )

    // Get payment status
    const payload = await xumm.payload.get(paymentPointer)
    console.log('Payment status:', payload)

    let response = {
      completed: false,
      expired: false
    }

    if (payload.meta.expired) {
      response.expired = true
    }

    if (payload.meta.signed && payload.response?.txid) {
      // Create Supabase client
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // Record successful donation
      const { error: dbError } = await supabase
        .from('donations')
        .insert({
          user_id: payload.meta.user_token,
          amount: parseFloat(payload.payload.txjson.Amount.value),
          transaction_hash: payload.response.txid
        })

      if (dbError) throw dbError
      response.completed = true
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error checking XUMM payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
