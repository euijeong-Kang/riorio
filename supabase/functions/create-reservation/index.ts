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
    const { name, phone, email, date, time, guests, requests } = await req.json();

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

    // 예약 가능 여부 확인
    const { data: existingReservations, error: checkError } = await supabaseClient
      .from('reservations')
      .select('id', { count: 'exact' })
      .eq('reservation_date', date)
      .eq('reservation_time', time)
      .eq('status', 'confirmed');

    if (checkError) {
      throw checkError;
    }

    const currentReservations = existingReservations?.length || 0;
    const maxTables = 5;

    if (currentReservations >= maxTables) {
      return new Response(
        JSON.stringify({ 
          error: '해당 시간대는 예약이 마감되었습니다. 다른 시간을 선택해주세요.',
          available: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 예약 생성
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
        message: '예약이 완료되었습니다!',
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