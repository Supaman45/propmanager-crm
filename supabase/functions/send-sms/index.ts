// Supabase Edge Function to send SMS via Twilio
// This function handles SMS sending securely without exposing Twilio credentials in the frontend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { to, message, accountSid, authToken, fromNumber, tenantId, userId } = await req.json()

    // Validate required fields
    if (!to || !message || !accountSid || !authToken || !fromNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send SMS via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('To', to)
    formData.append('From', fromNumber)
    formData.append('Body', message)

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('Twilio API error:', twilioData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: twilioData.message || 'Failed to send SMS' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save outbound message and log notification if tenantId and userId are provided
    if (tenantId || userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        // Save outbound SMS message
        await supabase.from('sms_messages').insert({
          tenant_id: tenantId || null,
          phone_number: to,
          direction: 'outbound',
          message: message,
          twilio_sid: twilioData.sid,
          status: 'delivered'
        }).catch(err => {
          console.error('Error saving SMS message:', err)
          // Don't fail the request if saving fails
        })
        
        // Log notification if userId is provided
        if (tenantId && userId) {
          await supabase.from('notification_log').insert({
            user_id: userId,
            tenant_id: tenantId,
            type: 'sms',
            message: message,
            recipient: to,
            status: 'sent',
            sent_at: new Date().toISOString()
          }).catch(err => {
            console.error('Error logging notification:', err)
            // Don't fail the request if logging fails
          })
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageSid: twilioData.sid 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in send-sms function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
