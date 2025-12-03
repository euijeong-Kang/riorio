import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, phone, email, date, time, guests, requests, payment_status } = await req.json();

    if (!name || !phone || !date || !time || !guests) {
      return new Response(
        JSON.stringify({ error: '필수 정보를 모두 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 예약 생성 (관리자가 직접 추가하므로 5테이블 제한 무시)
    const { data: reservation, error: insertError } = await supabaseClient
      .from('reservations')
      .insert([
        {
          name,
          phone,
          email: email || null,
          reservation_date: date,
          reservation_time: time,
          guests: parseInt(guests),
          requests: requests || null,
          status: 'confirmed',
          payment_status: payment_status || 'approved',
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        reservation,
        message: '예약이 추가되었습니다!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});