import { CalendarCheck2, Clock3 } from 'lucide-react';
import type { PublishedSchedule } from './data';
import TeamNotes from './TeamNotes';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const AVATAR_COLORS = ['bg-[#DFF4E9] text-[#145C3B]', 'bg-[#FFF0D9] text-[#805315]', 'bg-[#E9E4FF] text-[#50408A]', 'bg-[#FFE4E8] text-[#8B3847]'];

export default function TeamWeekViewB({ schedule, todayKey, nicknames = {}, emojis = {}, avatars = {} }: { schedule: PublishedSchedule; todayKey: string; nicknames?: Record<string, string>; emojis?: Record<string, string>; avatars?: Record<string, string> }) {
  const dates = [...new Set(schedule.dateStatuses.map((item) => item.date))].sort();
  const nameById = new Map(schedule.employees.map((employee) => [employee.id, employee.displayName]));

  return (
    <section className="mt-7" aria-labelledby="team-week-title-b">
      <TeamNotes weekStart={schedule.week.startDate} employees={schedule.employees} nicknames={nicknames} emojis={emojis} />

      <div className="mb-4 mt-8 flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-[#9A8350]">WEEKLY LINE-UP</p>
          <h2 id="team-week-title-b" className="mt-1 text-[25px] font-black tracking-[-0.04em] text-[#102A24]">우리 팀 스케줄</h2>
        </div>
        <p className="rounded-full bg-[#E9EFEC] px-3 py-1.5 text-[12px] font-bold text-[#40534B]">24시간제</p>
      </div>

      <div className="space-y-3">
        {dates.map((date) => {
          const dateObject = new Date(`${date}T12:00:00+09:00`);
          const dayShifts = schedule.shifts.filter((shift) => shift.date === date).sort((a, b) => a.start.localeCompare(b.start));
          const isToday = date === todayKey;
          return (
            <article key={date} className={`overflow-hidden rounded-[24px] border bg-white ${isToday ? 'border-[#153B32] shadow-[0_10px_28px_rgba(12,42,35,0.10)]' : 'border-[#E6EAE8]'}`}>
              <header className={`flex items-center justify-between px-4 py-3.5 ${isToday ? 'bg-[#153B32] text-white' : 'bg-white text-[#15231E]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 flex-col items-center justify-center rounded-[14px] ${isToday ? 'bg-white/12' : 'bg-[#F1F4F2]'}`}>
                    <span className="text-[10px] font-bold opacity-60">{dateObject.getMonth() + 1}월</span>
                    <span className="text-[18px] font-black leading-5">{dateObject.getDate()}</span>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-extrabold">{DAY_NAMES[dateObject.getDay()]}요일 {isToday && <span className="ml-1 text-[#DFC976]">· 오늘</span>}</h3>
                    <p className={`mt-0.5 text-[12px] font-semibold ${isToday ? 'text-white/60' : 'text-[#818985]'}`}>{dayShifts.length ? `${dayShifts.length}개 근무가 있어요` : '배정된 근무가 없어요'}</p>
                  </div>
                </div>
                <CalendarCheck2 className={`h-5 w-5 ${isToday ? 'text-[#DFC976]' : 'text-[#AAB1AD]'}`} aria-hidden="true" />
              </header>

              {dayShifts.length > 0 && (
                <div className="divide-y divide-[#EDF0EE] px-4">
                  {dayShifts.map((shift, index) => {
                    const originalName = nameById.get(shift.employeeId) ?? '이름 확인 필요';
                    const name = nicknames[shift.employeeId] || originalName;
                    return (
                      <div key={shift.id} className="flex min-h-[72px] items-center gap-3 py-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[17px] font-black ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
                          {avatars[shift.employeeId] ? <img src={avatars[shift.employeeId]} alt="" className="h-full w-full object-cover" loading="lazy" /> : (emojis[shift.employeeId] || name.slice(0, 1))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                          <p className="truncate text-[16px] font-extrabold text-[#17231F]">{name}</p>
                            {shift.changed && <span className="rounded-full bg-[#FFF1C9] px-2 py-0.5 text-[10px] font-black text-[#725600]">변경</span>}
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-[#818985]"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{nicknames[shift.employeeId] ? `원본 이름 ${originalName}` : '게시된 예정 시간'}</p>
                        </div>
                        <p className="shrink-0 text-[18px] font-black tabular-nums tracking-[-0.03em] text-[#153B32]">{shift.start}<span className="mx-1 text-[#BAC0BD]">–</span>{shift.end}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="mt-4 px-1 text-[12px] leading-5 text-[#7A837E]">표시된 시간은 출퇴근 기록이 아닌 게시된 예정 시간입니다.</p>
    </section>
  );
}
