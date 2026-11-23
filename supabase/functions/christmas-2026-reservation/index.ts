import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const origin = 'https://riorio.co.kr';
const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' };
const respond = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request: Request) => {
  if (request.headers.get('origin') !== origin) return respond(403, { error: 'ACCESS_DENIED' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return respond(405, { error: 'METHOD_NOT_ALLOWED' });
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') ?? '')) return respond(415, { error: 'UNSUPPORTED_MEDIA_TYPE' });
  if (Number(request.headers.get('content-length') ?? 0) > 4096) return respond(413, { error: 'REQUEST_TOO_LARGE' });
  let body: Record<string, unknown>;
  try {
    if (!request.body) return respond(400, { error: 'INVALID_REQUEST' });
    const reader = request.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let size = 0;
    let text = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return respond(413, { error: 'REQUEST_TOO_LARGE' }); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return respond(400, { error: 'INVALID_REQUEST' });
  } catch { return respond(400, { error: 'INVALID_REQUEST' }); }
  const { requestKey, date, time, guests, pairingGuests, name, phone } = body;
  if (body.action === 'availability') {
    if ((date !== '2026-12-24' && date !== '2026-12-25') || !Number.isInteger(guests) || ![2, 3, 4].includes(guests as number)) return respond(400, { error: 'INVALID_REQUEST' });
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return respond(503, { error: 'AVAILABILITY_UNAVAILABLE' });
    try {
      const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await client.rpc('christmas_reservation_availability_2026', { p_date: date, p_guests: guests });
      if (error || !data) return respond(503, { error: 'AVAILABILITY_UNAVAILABLE' });
      return respond(200, { availability: data });
    } catch { return respond(503, { error: 'AVAILABILITY_UNAVAILABLE' }); }
  }
  if (body.action === 'status') {
    if (typeof requestKey !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) return respond(404, { error: 'STATUS_UNAVAILABLE' });
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return respond(503, { error: 'STATUS_UNAVAILABLE' });
    try {
      const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await client.rpc('christmas_reservation_status_2026', { p_request_key: requestKey });
      if (error) return respond(503, { error: 'STATUS_UNAVAILABLE' });
      if (!data || !['pending', 'confirmed', 'cancelled'].includes(data.status) || !Number.isInteger(data.guests) || data.guests < 2 || data.guests > 4) return respond(404, { error: 'STATUS_UNAVAILABLE' });
      return respond(200, { status: data.status, guests: data.guests });
    } catch { return respond(503, { error: 'STATUS_UNAVAILABLE' }); }
  }
  if (typeof requestKey !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestKey) || typeof date !== 'string' || typeof time !== 'string' || !Number.isInteger(guests) || !Number.isInteger(pairingGuests) || typeof name !== 'string' || typeof phone !== 'string' || body.termsAccepted !== true || body.expectedCoursePrice !== 120000 || body.expectedPairingPrice !== 40000 || body.expectedDepositPerGuest !== 30000) return respond(400, { error: 'INVALID_REQUEST' });
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return respond(503, { error: 'BOOKING_UNAVAILABLE' });
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc('christmas_reservation_create_2026', { p_request_key: requestKey, p_date: date, p_time: time, p_guests: guests, p_pairing_guests: pairingGuests, p_name: name.trim(), p_phone: phone.replace(/[\s-]/g, '') });
    if (error) return respond(503, { error: 'BOOKING_UNAVAILABLE' });
    if (data === 'created') return respond(202, { status: 'received' });
    if (data === 'replay') return respond(409, { error: 'REQUEST_STATUS_REQUIRED' });
    if (data === 'duplicate_phone') return respond(409, { error: 'DUPLICATE_PHONE' });
    if (data === 'sold_out' || data === 'conflict') return respond(409, { error: data === 'sold_out' ? 'SOLD_OUT' : 'REQUEST_CONFLICT' });
    if (data === 'invalid') return respond(400, { error: 'INVALID_REQUEST' });
    return respond(503, { error: 'BOOKING_UNAVAILABLE' });
  } catch { return respond(503, { error: 'BOOKING_UNAVAILABLE' }); }
});
