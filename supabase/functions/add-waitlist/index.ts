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
    const { name, phone, email, date, time, guests, requests } = await req.json();

    if (!name || !phone || !date || !time || !guests) {
      return new Response(
        JSON.stringify({ error: '필수 정보를 모두 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 전화번호에서 하이픈 제거 (일관성 유지)
    const phoneNumber = phone.replace(/[^\d]/g, '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 중복 등록 확인 (같은 전화번호로 같은 날짜/시간에 이미 대기열에 등록되어 있는지)
    const { data: existingWaitlist, error: checkError } = await supabaseClient
      .from('waitlist')
      .select('id')
      .eq('phone', phoneNumber)
      .eq('reservation_date', date)
      .eq('reservation_time', time)
      .in('status', ['waiting', 'notified']);

    if (checkError) {
      throw checkError;
    }

    if (existingWaitlist && existingWaitlist.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: '이미 해당 시간대의 대기열에 등록되어 있습니다.',
          alreadyRegistered: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 해당 날짜/시간의 현재 대기열 수 확인 (position 계산용)
    const { data: currentWaitlist, error: countError } = await supabaseClient
      .from('waitlist')
      .select('id', { count: 'exact' })
      .eq('reservation_date', date)
      .eq('reservation_time', time)
      .eq('status', 'waiting');

    if (countError) {
      throw countError;
    }

    const currentWaitlistCount = currentWaitlist?.length || 0;
    const position = currentWaitlistCount + 1;

    // 대기열 등록
    const { data: waitlist, error: insertError } = await supabaseClient
      .from('waitlist')
      .insert([
        {
          name,
          phone: phoneNumber,
          email: email || null,
          reservation_date: date,
          reservation_time: time,
          guests: parseInt(guests),
          requests: requests || null,
          status: 'waiting',
          position,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('대기열 등록 오류:', insertError);
      throw insertError;
    }

    console.log('대기열 등록 성공:', waitlist);
    console.log('등록된 전화번호:', phoneNumber);

    return new Response(
      JSON.stringify({
        success: true,
        waitlist: {
          id: waitlist.id,
          position: waitlist.position,
          status: waitlist.status,
          phone: waitlist.phone,
        },
        message: `대기열 ${position}번째로 등록되었습니다. 취소 예약이 발생하면 연락드리겠습니다.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('대기열 등록 오류:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || '대기열 등록 중 오류가 발생했습니다.',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

