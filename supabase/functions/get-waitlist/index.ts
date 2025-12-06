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
    const { phone } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: '전화번호를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 전화번호 정규화 (하이픈 제거)
    const phoneNumber = phone.replace(/[^\d]/g, '');
    
    console.log('조회 요청 전화번호 (원본):', phone);
    console.log('조회 요청 전화번호 (정규화):', phoneNumber);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 전화번호로 대기열 조회 (하이픈 포함/미포함 모두 검색 - 기존 데이터 호환)
    // 기존 데이터는 하이픈 포함 형식일 수 있으므로 두 가지 형식 모두 검색
    
    // 디버깅: 모든 대기열 데이터 확인 (전화번호 필터 없이)
    const { data: allWaitlist } = await supabaseClient
      .from('waitlist')
      .select('phone, name, reservation_date, reservation_time, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // 전화번호로 대기열 조회
    const { data: waitlist, error } = await supabaseClient
      .from('waitlist')
      .select('*')
      .or(`phone.eq.${phone},phone.eq.${phoneNumber}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('대기열 조회 오류:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          waitlist: [],
          debug: {
            searchedPhone: phone,
            normalizedPhone: phoneNumber,
            allWaitlistSample: allWaitlist || [],
          },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 디버깅 정보를 응답에 포함
    return new Response(
      JSON.stringify({
        success: true,
        waitlist: waitlist || [],
        debug: {
          searchedPhone: phone,
          normalizedPhone: phoneNumber,
          allWaitlistSample: allWaitlist || [],
          queryResult: waitlist || [],
          queryError: null,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    // 디버깅 정보를 응답에 포함
    return new Response(
      JSON.stringify({
        success: true,
        waitlist: waitlist || [],
        debug: {
          searchedPhone: phone,
          normalizedPhone: phoneNumber,
          allWaitlistSample: allWaitlist || [],
          queryResult: waitlist || [],
          queryError: null,
        },
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

