import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const origin = 'https://riorio.co.kr';
const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' };
const respond = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request: Request) => {
  if (request.headers.get('origin') !== origin) return respond(403, { error: 'ACCESS_DENIED' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return respond(405, { error: 'METHOD_NOT_ALLOWED' });
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') ?? '')) return respond(415, { error: 'UNSUPPORTED_MEDIA_TYPE' });
  if (Number(request.headers.get('content-length') ?? 0) > 4096) return respond(413, { error: 'REQUEST_TOO_LARGE' });
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 4096) return respond(413, { error: 'REQUEST_TOO_LARGE' });
    body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return respond(400, { error: 'INVALID_REQUEST' });
  } catch { return respond(400, { error: 'INVALID_REQUEST' }); }
  const { requestKey, date, time, guests, pairingGuests, name, phone } = body;
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
    if (data === 'sold_out' || data === 'conflict') return respond(409, { error: data === 'sold_out' ? 'SOLD_OUT' : 'REQUEST_CONFLICT' });
    if (data === 'invalid') return respond(400, { error: 'INVALID_REQUEST' });
    return respond(503, { error: 'BOOKING_UNAVAILABLE' });
  } catch { return respond(503, { error: 'BOOKING_UNAVAILABLE' }); }
});
