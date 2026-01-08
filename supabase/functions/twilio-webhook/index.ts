import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const normalizedPhone = from.replace('+1', '').replace(/\D/g, '');

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, phone, property')
      .eq('phone', normalizedPhone)
      .single();

    await supabase.from('sms_messages').insert({
      tenant_id: tenant?.id || null,
      phone_number: from,
      direction: 'inbound',
      message: body,
      twilio_sid: messageSid,
      status: 'delivered'
    });

    const maintenanceKeywords = ['broken', 'leak', 'leaking', 'repair', 'fix', 'not working', 'emergency', 'urgent', 'ac', 'heat', 'water', 'door', 'lock'];
    const lowerBody = body.toLowerCase();
    const isMaintenanceRequest = maintenanceKeywords.some(kw => lowerBody.includes(kw));

    if (isMaintenanceRequest) {
      await supabase.from('maintenance_requests').insert({
        tenant_id: tenant?.id || null,
        tenant_name: tenant?.name || 'Unknown',
        property: tenant?.property || 'Not specified',
        issue: 'SMS: ' + body.substring(0, 50),
        description: body,
        status: 'Pending',
        priority: lowerBody.includes('emergency') || lowerBody.includes('urgent') ? 'URGENT' : 'MEDIUM',
        source: 'sms'
      });
    }

    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' }, status: 500 }
    );
  }
});
