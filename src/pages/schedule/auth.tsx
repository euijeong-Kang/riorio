import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loadScheduleCollection } from './scheduleApi';
import { activateScheduleEmployee, getEmployeeSession, isSupabaseScheduleConfigured, signInScheduleEmployee } from './scheduleBackend';

export default function ScheduleAuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'invite'>('login');
  const [employees, setEmployees] = useState<{ id: string; displayName: string }[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selected = employees.find((employee) => employee.id === employeeId);

  useEffect(() => { loadScheduleCollection().then((weeks) => { const list = weeks.at(-1)?.employees ?? []; setEmployees(list); setEmployeeId(list[0]?.id ?? ''); }); }, []);
  useEffect(() => { if (isSupabaseScheduleConfigured) getEmployeeSession().then((session) => { if (session) navigate('/schedule', { replace: true }); }); }, [navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'invite') {
        if (!selected) throw new Error('직원 이름을 선택해 주세요.');
        await activateScheduleEmployee(selected.id, selected.displayName, inviteCode, loginId, password);
      }
      await signInScheduleEmployee(loginId, password);
      navigate('/schedule', { replace: true });
    } catch (caught) { setError(caught instanceof Error ? caught.message : '처리하지 못했습니다.'); }
    finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-[#F2F4F1] px-4 py-8 text-[#17231F]"><section className="mx-auto max-w-[430px]"><Link to="/schedule" className="inline-flex min-h-11 items-center gap-2 text-[14px] font-bold text-[#64706A]"><ArrowLeft className="h-4 w-4" />근무표로 돌아가기</Link><div className="mt-4 rounded-[28px] bg-white p-6 shadow-[0_18px_55px_rgba(12,42,35,0.09)]"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#153B32] text-[15px] font-black text-white">RR</div><p className="mt-5 text-[12px] font-black tracking-[0.12em] text-[#9A8350]">RIORIO CREW</p><h1 className="mt-1 text-[29px] font-black tracking-[-0.04em]">{mode === 'login' ? '안녕하세요, 반가워요' : '내 계정을 만들어요'}</h1><p className="mt-2 text-[14px] leading-6 text-[#6E7773]">{mode === 'login' ? '한 번 로그인하면 다음부터 바로 근무표가 열려요.' : '매니저에게 받은 초대코드로 아이디와 비밀번호를 직접 정하세요.'}</p><div className="mt-6 grid grid-cols-2 rounded-2xl bg-[#EEF1EF] p-1"><button type="button" onClick={() => { setMode('login'); setError(''); }} className={`min-h-11 rounded-xl text-[14px] font-extrabold ${mode === 'login' ? 'bg-white shadow-sm' : 'text-[#747D78]'}`}>로그인</button><button type="button" onClick={() => { setMode('invite'); setError(''); }} className={`min-h-11 rounded-xl text-[14px] font-extrabold ${mode === 'invite' ? 'bg-white shadow-sm' : 'text-[#747D78]'}`}>초대코드로 시작</button></div><form onSubmit={submit} className="mt-5 space-y-4">{mode === 'invite' && <><label className="block text-[13px] font-bold">내 이름<select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-[#D8DEDB] bg-white px-4 text-[16px]">{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.displayName}</option>)}</select></label><label className="block text-[13px] font-bold">초대코드<input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))} className="mt-2 min-h-12 w-full rounded-2xl border border-[#D8DEDB] px-4 text-[16px] uppercase tracking-[0.08em]" placeholder="매니저에게 받은 코드" /></label></>}<label className="block text-[13px] font-bold">{mode === 'login' ? '아이디' : '사용할 아이디'}<input autoCapitalize="none" autoComplete="username" value={loginId} onChange={(event) => setLoginId(event.target.value.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20))} className="mt-2 min-h-12 w-full rounded-2xl border border-[#D8DEDB] px-4 text-[16px]" placeholder={mode === 'login' ? '내 아이디' : '영문·숫자 4~20자'} /></label><label className="block text-[13px] font-bold">{mode === 'login' ? '비밀번호' : '사용할 비밀번호'}<div className="relative mt-2"><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-2xl border border-[#D8DEDB] px-4 pr-12 text-[16px]" placeholder="8자 이상" /><button type="button" aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'} onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center text-[#6E7773]">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label>{!isSupabaseScheduleConfigured && <p className="rounded-xl bg-[#FFF5D8] p-3 text-[12px] font-semibold leading-5 text-[#725600]">현재는 로컬 미리보기입니다. Supabase 연결 후 초대코드와 로그인이 활성화됩니다.</p>}{error && <p role="alert" className="rounded-xl bg-[#FFF0EE] p-3 text-[13px] font-bold text-[#9A3D25]">{error}</p>}<button disabled={busy || !isSupabaseScheduleConfigured || loginId.length < 4 || password.length < 8 || (mode === 'invite' && inviteCode.length < 6)} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#153B32] px-4 text-[16px] font-extrabold text-white disabled:bg-[#AEB6B2]">{mode === 'login' ? <LogIn className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}{busy ? '처리 중…' : mode === 'login' ? '로그인' : '계정 만들기'}</button></form><div className="mt-5 flex items-start gap-2 rounded-xl bg-[#F5F7F5] p-3 text-[12px] leading-5 text-[#65706B]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#28704B]" />초대코드는 한 번만 사용할 수 있어요. 만든 아이디와 비밀번호는 이 기기에 로그인 상태로 유지됩니다.</div></div></section></main>;
}
