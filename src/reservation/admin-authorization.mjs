export async function authorizeEventAdmin(authorization, eventId, dependencies) {
  if (typeof authorization !== 'string' || authorization.length > 8192 || !/^Bearer [^\s]+$/.test(authorization)) return { ok: false, status: 401 };
  if (typeof eventId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(eventId)) return { ok: false, status: 400 };
  if (!dependencies || typeof dependencies.verifyAccessToken !== 'function' || typeof dependencies.loadAdminGrant !== 'function') return { ok: false, status: 503 };

  let identity;
  try {
    identity = await dependencies.verifyAccessToken(authorization.slice(7));
  } catch {
    return { ok: false, status: 503 };
  }
  if (!identity || typeof identity.id !== 'string' || !identity.id.trim()) return { ok: false, status: 401 };

  let grant;
  try {
    grant = await dependencies.loadAdminGrant(identity.id, eventId);
  } catch {
    return { ok: false, status: 503 };
  }
  if (!grant || grant.active !== true || grant.userId !== identity.id || grant.eventId !== eventId || grant.role !== 'event_admin') return { ok: false, status: 403 };
  return { ok: true, principalId: identity.id, eventId };
}
