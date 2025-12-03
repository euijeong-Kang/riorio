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
    const { reservationId, phone } = await req.json();

    if (!reservationId || !phone) {
      return new Response(
        JSON.stringify({ error: '필수 정보가 누락되었습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 예약 확인 (본인 확인)
    const { data: reservation, error: checkError } = await supabaseClient
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .eq('phone', phone)
      .single();

    if (checkError || !reservation) {
      return new Response(
        JSON.stringify({ error: '예약을 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 예약 날짜 확인 (5일 전까지만 취소 가능)
    const reservationDate = new Date(reservation.reservation_date);
    const now = new Date();
    const daysUntilReservation = Math.ceil((reservationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilReservation < 5) {
      return new Response(
        JSON.stringify({ 
          error: '예약 5일 전부터는 취소가 불가능합니다. 문의사항이 있으시면 매장으로 연락주세요.',
          canCancel: false
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 예약 상태를 '취소됨'으로 변경
    const { error: updateError } = await supabaseClient
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId);

    if (updateError) {
      throw updateError;
    }

    // 취소된 예약의 날짜/시간에 대해 대기열 처리
    try {
      const waitlistResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-waitlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            date: reservation.reservation_date,
            time: reservation.reservation_time,
          }),
        }
      );

      // 대기열 처리 실패해도 예약 취소는 성공으로 처리
      if (waitlistResponse.ok) {
        const waitlistData = await waitlistResponse.json();
        console.log('대기열 처리 완료:', waitlistData);
      }
    } catch (waitlistError) {
      // 대기열 처리 실패는 로그만 남기고 예약 취소는 정상 처리
      console.error('대기열 처리 중 오류:', waitlistError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '예약이 취소되었습니다. 예약금은 영업일 기준 3-5일 내에 환불됩니다.',
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