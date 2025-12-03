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
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: '아이디와 비밀번호를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 관리자 확인
    const { data: admin, error } = await supabaseClient
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !admin) {
      return new Response(
        JSON.stringify({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 간단한 비밀번호 확인 (실제로는 bcrypt 등을 사용해야 함)
    // 여기서는 간단하게 평문 비교
    if (admin.password_hash !== password) {
      return new Response(
        JSON.stringify({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 세션 토큰 생성 (간단한 방식)
    const token = btoa(`${username}:${Date.now()}`);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        username: admin.username,
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