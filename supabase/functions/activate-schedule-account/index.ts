import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const internalEmail = (loginId: string) => `${loginId.toLowerCase()}@staff.riorio.internal`;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });

  let createdUserId: string | undefined;
  try {
    const { employeeId, originalName, inviteCode, loginId, password } = await request.json();
    if (!/^[a-zA-Z0-9._-]{4,20}$/.test(loginId) || typeof password !== 'string' || password.length < 8) {
      throw new Error('아이디 또는 비밀번호 형식을 확인해 주세요.');
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: inviteId, error: inviteError } = await admin.rpc('verify_schedule_employee_invite', {
      p_employee_id: employeeId,
      p_original_name: originalName,
      p_code: inviteCode,
    });
    if (inviteError) throw inviteError;
    if (!inviteId) throw new Error('이름 또는 가입코드가 올바르지 않습니다.');

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: internalEmail(loginId),
      password,
      email_confirm: true,
    });
    if (createError) throw createError;
    createdUserId = created.user.id;

    const { error: profileError } = await admin.from('schedule_employee_profiles').upsert({
      employee_id: employeeId,
      original_name: originalName,
      user_id: created.user.id,
      login_id: loginId,
      active: true,
    });
    if (profileError) throw profileError;

    const { error: inviteUseError } = await admin
      .from('schedule_employee_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', inviteId)
      .is('used_at', null);
    if (inviteUseError) throw inviteUseError;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (createdUserId) {
      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      await admin.auth.admin.deleteUser(createdUserId);
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '계정을 만들지 못했습니다.' }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }
});
