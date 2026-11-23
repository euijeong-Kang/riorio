import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { christmas } from '../pages/public/event';

export function useChristmasBookingOpen(preserveOpen = false) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.functions.invoke('christmas-2026-reservation', { body: { action: 'availability', date: christmas.dates[0], guests: 2 } });
        const availability = data?.availability;
        const available = !error && !!availability && christmas.startTimes.every((time) => availability[time] === null || (Number.isInteger(availability[time]) && availability[time] >= 0 && availability[time] <= 5));
        if (active) setOpen((previous) => available || (preserveOpen && previous));
      } catch { if (active && !preserveOpen) setOpen(false); }
    };
    void check();
    const timer = window.setInterval(check, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, [preserveOpen]);
  return open;
}
