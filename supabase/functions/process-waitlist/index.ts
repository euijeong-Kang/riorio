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
    const { date, time } = await req.json();

    if (!date || !time) {
      return new Response(
        JSON.stringify({ error: '날짜와 시간을 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 만료된 알림 처리 (24시간 지난 notified 상태를 cancelled로 변경)
    const expiredTime = new Date();
    expiredTime.setHours(expiredTime.getHours() - 24);
    
    await supabaseClient
      .from('waitlist')
      .update({ status: 'cancelled' })
      .eq('reservation_date', date)
      .eq('reservation_time', time)
      .eq('status', 'notified')
      .lt('expires_at', expiredTime.toISOString());

    // 해당 날짜/시간의 첫 번째 대기자 조회 (waiting 상태, position ASC)
    const { data: firstWaitlist, error: waitlistError } = await supabaseClient
      .from('waitlist')
      .select('*')
      .eq('reservation_date', date)
      .eq('reservation_time', time)
      .eq('status', 'waiting')
      .order('position', { ascending: true })
      .limit(1)
      .single();

    if (waitlistError || !firstWaitlist) {
      // 대기자가 없으면 성공 응답 (대기자가 없는 것도 정상)
      return new Response(
        JSON.stringify({
          success: true,
          notified: 0,
          message: '대기자가 없습니다.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 첫 번째 대기자에게 알림 (상태를 'notified'로 변경, expires_at 설정)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24시간 후 만료

    const { error: updateError } = await supabaseClient
      .from('waitlist')
      .update({
        status: 'notified',
        notified_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', firstWaitlist.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        notified: 1,
        waitlist: {
          id: firstWaitlist.id,
          name: firstWaitlist.name,
          phone: firstWaitlist.phone,
          email: firstWaitlist.email,
        },
        message: '대기자에게 알림을 발송했습니다.',
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

