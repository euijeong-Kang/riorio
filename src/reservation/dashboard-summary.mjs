export function summarizeReservations(rows) {
  const summary = { activeCount: 0, totalGuests: 0, confirmedGuests: 0, pendingGuests: 0, revenue: 0, groups: new Map() };
  for (const row of rows) {
    const key = `${row.reservation_date}_${row.reservation_time.slice(0, 5)}`;
    const group = summary.groups.get(key) ?? [];
    group.push(row);
    summary.groups.set(key, group);
    if (row.status === 'cancelled') continue;
    summary.activeCount += 1;
    summary.totalGuests += row.guests;
    if (row.status === 'confirmed') summary.confirmedGuests += row.guests;
    if (row.status === 'pending') summary.pendingGuests += row.guests;
    summary.revenue += row.guests * row.course_price + row.pairing_guests * row.pairing_price;
  }
  return { ...summary, groups: [...summary.groups.entries()].sort(([left], [right]) => left.localeCompare(right)) };
}
