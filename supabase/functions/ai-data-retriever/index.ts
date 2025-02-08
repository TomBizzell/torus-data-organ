
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader)
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Parse query parameters from request body
    const { agent_id, from_date, to_date, limit, offset } = await req.json()

    if (!agent_id) {
      throw new Error('Missing required field: agent_id')
    }

    // Build the query
    let query = supabaseClient
      .from('ai_agent_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_id', agent_id)
      .order('created_at', { ascending: false })

    // Apply optional filters
    if (from_date) {
      query = query.gte('created_at', from_date)
    }
    if (to_date) {
      query = query.lte('created_at', to_date)
    }
    if (limit) {
      query = query.limit(limit)
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        data,
        count,
        message: 'Data retrieved successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in ai-data-retriever:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message === 'Method not allowed' ? 405 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
