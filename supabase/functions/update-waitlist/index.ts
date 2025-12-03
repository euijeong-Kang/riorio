import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { id, name, phone, email, reservation_date, reservation_time, guests, requests, status, position } = await req.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: '대기열 ID가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) {
      // 전화번호 정규화
      updateData.phone = phone.replace(/[^\d]/g, '');
    }
    if (email !== undefined) updateData.email = email || null;
    if (reservation_date) updateData.reservation_date = reservation_date;
    if (reservation_time) updateData.reservation_time = reservation_time;
    if (guests) updateData.guests = parseInt(guests);
    if (requests !== undefined) updateData.requests = requests || null;
    if (status) updateData.status = status;
    if (position !== undefined) updateData.position = parseInt(position);
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseClient
      .from('waitlist')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        waitlist: data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('대기열 수정 오류:', error);
    return new Response(
      JSON.stringify({ error: error.message || '대기열 수정 중 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

