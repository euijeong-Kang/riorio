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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 모든 대기열 조회 (날짜/시간 순서)
    const { data: waitlist, error } = await supabaseClient
      .from('waitlist')
      .select('*')
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true })
      .order('position', { ascending: true });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        waitlist: waitlist || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('대기열 조회 오류:', error);
    return new Response(
      JSON.stringify({ error: error.message || '대기열 조회 중 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

