
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { IPFS } from 'https://esm.sh/ipfs-core@0.18.1'
import OrbitDB from 'https://esm.sh/orbit-db@0.29.0'

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

    // Get unsynchronized records
    const { data: pendingRecords, error: fetchError } = await supabaseClient
      .from('ai_agent_data')
      .select('*')
      .eq('sync_status', 'pending')
      .limit(10)

    if (fetchError) throw fetchError

    if (!pendingRecords || pendingRecords.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending records to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize IPFS and OrbitDB
    const ipfs = await IPFS.create()
    const orbitdb = await OrbitDB.createInstance(ipfs)
    
    // Open/Create the database
    const db = await orbitdb.keyvalue('torus-ai-data')
    await db.load()

    // Process each record
    for (const record of pendingRecords) {
      try {
        // Store in OrbitDB
        const hash = await db.put(record.id, {
          agent_id: record.agent_id,
          data_payload: record.data_payload,
          timestamp: record.created_at
        })

        // Update Supabase record with OrbitDB hash
        const { error: updateError } = await supabaseClient
          .from('ai_agent_data')
          .update({
            orbit_db_hash: hash,
            sync_status: 'synced'
          })
          .eq('id', record.id)

        if (updateError) throw updateError

        console.log(`Synced record ${record.id} with hash ${hash}`)
      } catch (error) {
        console.error(`Error syncing record ${record.id}:`, error)
        
        // Mark record as failed
        await supabaseClient
          .from('ai_agent_data')
          .update({
            sync_status: 'failed'
          })
          .eq('id', record.id)
      }
    }

    // Clean up
    await db.close()
    await orbitdb.stop()
    await ipfs.stop()

    return new Response(
      JSON.stringify({ 
        message: `Synced ${pendingRecords.length} records to OrbitDB`,
        synced_records: pendingRecords.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in orbitdb-sync:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
