export function createChristmasAdminApi(client) {
  if (!client || typeof client.from !== 'function' || typeof client.rpc !== 'function') throw new TypeError('Supabase client required');
  return {
    async list() {
      const { data, error } = await client.from('christmas_reservations_2026')
        .select('id,reservation_date,reservation_time,guests,pairing_guests,name,phone,status,course_price,pairing_price,deposit_per_guest,created_at,transfer_deadline')
        .order('created_at', { ascending: false });
      if (error) throw new Error('예약 목록을 불러오지 못했습니다.');
      return data ?? [];
    },
    async update(reservationId, action, transferChecked = false) {
      if (typeof reservationId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reservationId) || !['confirmed', 'cancelled'].includes(action) || (action === 'confirmed' && transferChecked !== true)) throw new TypeError('Invalid admin action');
      const { data, error } = await client.rpc('christmas_reservation_admin_action_2026', { p_reservation_id: reservationId, p_action: action, p_transfer_checked: transferChecked });
      if (error || !['confirmed', 'cancelled', 'already_confirmed', 'already_cancelled', 'not_found', 'not_eligible'].includes(data)) throw new Error('예약 상태를 변경하지 못했습니다.');
      return data;
    },
  };
}
