const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 환경 변수에서 설정 가져오기
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || '';
const GMAIL_EMAIL = Deno.env.get('GMAIL_EMAIL') || '';
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') || '';

// 이메일 발송 함수 (Gmail SMTP 직접 구현 - Deno 2.x 호환)
async function sendEmail(name: string, contact: string, story: string) {
  // 환경 변수 확인 및 로깅
  console.log('환경 변수 확인:', {
    hasAdminEmail: !!ADMIN_EMAIL,
    hasGmailEmail: !!GMAIL_EMAIL,
    hasAppPassword: !!GMAIL_APP_PASSWORD,
    adminEmail: ADMIN_EMAIL ? `${ADMIN_EMAIL.substring(0, 3)}***` : '없음',
    gmailEmail: GMAIL_EMAIL ? `${GMAIL_EMAIL.substring(0, 3)}***` : '없음',
  });

  if (!ADMIN_EMAIL || !GMAIL_EMAIL || !GMAIL_APP_PASSWORD) {
    const missing = [];
    if (!ADMIN_EMAIL) missing.push('ADMIN_EMAIL');
    if (!GMAIL_EMAIL) missing.push('GMAIL_EMAIL');
    if (!GMAIL_APP_PASSWORD) missing.push('GMAIL_APP_PASSWORD');
    throw new Error(`이메일 설정이 완료되지 않았습니다. 누락된 환경 변수: ${missing.join(', ')}`);
  }

  const emailSubject = `[RIORIO] 새로운 사연이 도착했습니다 - ${name}`;
  const emailBody = `
새로운 사연이 제출되었습니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 제출자 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 성함: ${name}
📞 연락처: ${contact}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 사연 내용
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${story}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 제출 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  try {
    console.log('이메일 발송 시작:', {
      to: ADMIN_EMAIL,
      from: GMAIL_EMAIL,
      subject: emailSubject,
    });

    // Gmail SMTP를 직접 구현 (Deno 2.x 호환)
    // TLS 연결을 위한 TCP 연결
    const conn = await Deno.connectTls({
      hostname: "smtp.gmail.com",
      port: 465,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // SMTP 응답 읽기 함수
    async function readResponse(): Promise<string> {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      if (n === null) throw new Error('Connection closed');
      return decoder.decode(buffer.subarray(0, n));
    }

    // SMTP 명령 전송 함수
    async function sendCommand(command: string): Promise<string> {
      await conn.write(encoder.encode(command + '\r\n'));
      return await readResponse();
    }

    try {
      // 서버 환영 메시지 읽기
      const welcome = await readResponse();
      console.log('SMTP 서버 응답:', welcome);

      // EHLO 명령
      const ehloResponse = await sendCommand(`EHLO smtp.gmail.com`);
      console.log('EHLO 응답:', ehloResponse);

      // AUTH LOGIN
      const authResponse = await sendCommand('AUTH LOGIN');
      console.log('AUTH LOGIN 응답:', authResponse);

      // 사용자명 인코딩 (Base64)
      const usernameB64 = btoa(GMAIL_EMAIL);
      const usernameResponse = await sendCommand(usernameB64);
      console.log('Username 응답:', usernameResponse);

      // 비밀번호 인코딩 (Base64)
      const passwordB64 = btoa(GMAIL_APP_PASSWORD);
      const passwordResponse = await sendCommand(passwordB64);
      console.log('Password 응답:', passwordResponse);

      if (!passwordResponse.includes('235')) {
        throw new Error('SMTP 인증 실패: ' + passwordResponse);
      }

      // MAIL FROM
      const mailFromResponse = await sendCommand(`MAIL FROM:<${GMAIL_EMAIL}>`);
      console.log('MAIL FROM 응답:', mailFromResponse);

      // RCPT TO
      const rcptToResponse = await sendCommand(`RCPT TO:<${ADMIN_EMAIL}>`);
      console.log('RCPT TO 응답:', rcptToResponse);

      // DATA
      const dataResponse = await sendCommand('DATA');
      console.log('DATA 응답:', dataResponse);

      // UTF-8을 Base64로 변환하는 헬퍼 함수
      function utf8ToBase64(str: string): string {
        return btoa(unescape(encodeURIComponent(str)));
      }

      // 이메일 내용 전송
      const emailContent = [
        `From: ${GMAIL_EMAIL}`,
        `To: ${ADMIN_EMAIL}`,
        `Subject: =?UTF-8?B?${utf8ToBase64(emailSubject).replace(/\+/g, '-').replace(/\//g, '_')}?=`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: base64`,
        '',
        utf8ToBase64(emailBody)
      ].join('\r\n');

      await conn.write(encoder.encode(emailContent + '\r\n.\r\n'));
      const sendResponse = await readResponse();
      console.log('이메일 전송 응답:', sendResponse);

      if (!sendResponse.includes('250')) {
        throw new Error('이메일 전송 실패: ' + sendResponse);
      }

      // QUIT
      await sendCommand('QUIT');
      console.log('이메일 발송 성공');

      return {
        success: true,
        message: '이메일이 성공적으로 발송되었습니다.'
      };
    } finally {
      conn.close();
    }
  } catch (error) {
    console.error('이메일 발송 오류 상세:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { name, contact, story } = await req.json();

    // 입력 검증
    if (!name || !contact || !story) {
      return new Response(
        JSON.stringify({ error: '필수 정보를 모두 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (story.length > 500) {
      return new Response(
        JSON.stringify({ error: '사연은 500자 이내로 작성해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 이메일 발송 (실패해도 계속 진행)
    let emailSent = false;
    let emailError = null;
    try {
      const emailResult = await sendEmail(name.trim(), contact.trim(), story.trim());
      emailSent = emailResult.success;
      console.log('이메일 발송 결과:', emailResult);
    } catch (err) {
      emailError = {
        message: err.message,
        name: err.name,
      };
      console.error('이메일 발송 실패:', emailError);
      // 이메일 발송 실패해도 사연 제출은 성공으로 처리
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '사연이 성공적으로 전송되었습니다.',
        emailSent,
        emailError: emailError ? emailError.message : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('사연 제출 오류:', error);
    return new Response(
      JSON.stringify({ error: error.message || '사연 제출 중 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
