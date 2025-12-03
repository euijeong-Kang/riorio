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
    const { phone } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: '전화번호를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 전화번호 정규화 (하이픈 제거)
    const phoneNumber = phone.replace(/[^\d]/g, '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 전화번호로 예약 조회 (하이픈 포함/미포함 모두 검색)
    // 기존 데이터는 하이픈 포함 형식일 수 있으므로 두 가지 형식 모두 검색
    const { data: reservations, error } = await supabaseClient
      .from('reservations')
      .select('*')
      .or(`phone.eq.${phone},phone.eq.${phoneNumber}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!reservations || reservations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: '해당 전화번호로 등록된 예약이 없습니다.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        reservations,
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