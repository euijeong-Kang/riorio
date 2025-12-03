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
    const { date, time } = await req.json();

    if (!date || !time) {
      return new Response(
        JSON.stringify({ error: '날짜와 시간을 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 해당 날짜/시간의 확정된 예약 수 조회
    const { data, error } = await supabaseClient
      .from('reservations')
      .select('id', { count: 'exact' })
      .eq('reservation_date', date)
      .eq('reservation_time', time)
      .eq('status', 'confirmed');

    if (error) {
      throw error;
    }

    const currentReservations = data?.length || 0;
    const maxTables = 5;
    const available = currentReservations < maxTables;
    const remainingTables = Math.max(0, maxTables - currentReservations);

    return new Response(
      JSON.stringify({
        available,
        currentReservations,
        maxTables,
        remainingTables,
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