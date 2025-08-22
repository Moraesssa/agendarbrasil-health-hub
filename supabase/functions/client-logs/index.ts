import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Allowlist of emails that can use advanced logging (replace with your actual email)
const ALLOWED_EMAILS = [
  'your-email@example.com', // Replace with your actual email
]

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

    if (req.method === 'POST') {
      // Receive and store client logs
      const { events, sentAt, client } = await req.json()
      
      if (!events || !Array.isArray(events)) {
        return new Response(JSON.stringify({ error: 'Invalid payload' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Basic rate limiting by IP
      const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      
      // Process and store logs
      const logsToInsert = events.map((event: any) => ({
        trace_id: event.traceId || event.sessionId,
        session_id: event.sessionId,
        user_id: event.userId || null,
        level: event.level,
        message: event.message || '',
        stack_trace: event.stack || null,
        url: event.url || client?.url || '',
        user_agent: event.userAgent || client?.ua || '',
        timestamp: event.ts || event.timestamp || new Date().toISOString(),
        context: event.context || null,
        meta: {
          ...event.meta,
          rawArgs: event.rawArgs,
          breadcrumbs: event.breadcrumbs,
          clientInfo: client,
          ip: clientIP
        },
        performance_data: event.performanceData || null
      }))

      const { error } = await supabaseClient
        .from('client_logs')
        .insert(logsToInsert)

      if (error) {
        console.error('Error storing logs:', error)
        return new Response(JSON.stringify({ error: 'Failed to store logs' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ 
        success: true, 
        stored: events.length,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'GET') {
      // Query logs (restricted access)
      const url = new URL(req.request.url)
      const traceId = url.searchParams.get('traceId')
      const level = url.searchParams.get('level')
      const limit = parseInt(url.searchParams.get('limit') || '100')

      // Get JWT from Authorization header
      const authHeader = req.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const jwt = authHeader.replace('Bearer ', '')
      
      // Verify JWT and check allowlist
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)
      
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check if user is in allowlist (either in DB or hardcoded list)
      const { data: allowlistEntry } = await supabaseClient
        .from('debug_allowlist')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      const isAllowed = allowlistEntry || ALLOWED_EMAILS.includes(user.email || '')

      if (!isAllowed) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Build query
      let query = supabaseClient
        .from('client_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (traceId) {
        query = query.eq('trace_id', traceId)
      }

      if (level) {
        query = query.eq('level', level)
      }

      const { data: logs, error } = await query

      if (error) {
        console.error('Error querying logs:', error)
        return new Response(JSON.stringify({ error: 'Failed to query logs' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ 
        logs,
        total: logs.length,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Client logs function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})