import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, BookOpen, Check, ChevronDown, ChevronRight, Circle,
  Clock3, LockKeyhole, LogOut, Search, ShieldCheck, Sparkles, UtensilsCrossed, X,
} from "lucide-react";
import { categories, manualSections, manualUpdatedAt, type ManualBlock, type ManualSection } from "./data";

const STORAGE_KEY = "riorio-manual-checks";
const CHECK_DATE_KEY = "riorio-manual-check-date";
const AUTH_STORAGE_KEY = "riorio-manual-session";
const ACCESS_CODE_HASH = "ae1b279cf8a3d46f59fca007a4da98a1bbad1f4b097acf11cdb83960bcf1092f";
const SESSION_DURATION = 1000 * 60 * 60 * 24 * 30;

type ManualSession = { expiresAt: number };

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hasValidSession() {
  try {
    const session = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? "null") as ManualSession | null;
    if (session?.expiresAt && session.expiresAt > Date.now()) return true;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  return false;
}

function ManualLogin({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const valid = await sha256(code.trim()) === ACCESS_CODE_HASH;
    if (valid) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ expiresAt: Date.now() + SESSION_DURATION } satisfies ManualSession));
      onSuccess();
    } else {
      setError("인증번호가 올바르지 않아요. 다시 확인해주세요.");
      setCode("");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-5 py-10 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#102c25] text-white shadow-sm"><LockKeyhole size={25} /></span>
          <h1 className="mt-5 text-2xl font-black tracking-[-0.035em] text-slate-950">직원 매뉴얼</h1>
          <p className="mt-2 text-[15px] leading-6 text-slate-500">리오리오 직원 인증번호를 입력해주세요.</p>
        </div>
        <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <label htmlFor="manual-access-code" className="mb-2 block text-sm font-bold text-slate-700">인증번호</label>
          <input
            id="manual-access-code"
            type="password"
            inputMode="text"
            autoComplete="current-password"
            value={code}
            onChange={(event) => { setCode(event.target.value); setError(""); }}
            placeholder="인증번호 입력"
            autoFocus
            className={`h-14 w-full rounded-2xl border bg-slate-50 px-4 text-base font-semibold outline-none transition focus:bg-white focus:ring-4 ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`}
          />
          {error && <p role="alert" className="mt-2.5 text-sm font-medium text-rose-600">{error}</p>}
          <button type="submit" disabled={!code.trim() || submitting} className="mt-4 flex h-14 w-full items-center justify-center rounded-2xl bg-blue-600 text-base font-extrabold text-white transition hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400">
            {submitting ? "확인 중..." : "매뉴얼 열기"}
          </button>
          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400"><ShieldCheck className="mt-0.5 shrink-0" size={15} /><span>인증 후 이 기기에서는 30일 동안 로그인 상태가 유지됩니다.</span></div>
        </form>
        <p className="mt-5 text-center text-xs text-slate-400">RIORIO STAFF ONLY</p>
      </div>
    </div>
  );
}

function normalize(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
}

function searchableText(section: ManualSection) {
  return [section.title, section.summary, ...section.blocks.flatMap((block) => [
    block.title, block.script ?? "", block.note ?? "", ...(block.items ?? []), ...(block.tags ?? []),
  ])].join(" ");
}

function searchableBlockText(block: ManualBlock) {
  return [block.title, block.script ?? "", block.note ?? "", ...(block.items ?? []), ...(block.tags ?? [])].join(" ");
}

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function BlockCard({ block, sectionId, query, checkable, checks, onCheck }: {
  block: ManualBlock;
  sectionId: string;
  query: string;
  checkable: boolean;
  checks: Record<string, boolean>;
  onCheck: (key: string) => void;
}) {
  const [open, setOpen] = useState(Boolean(query));

  useEffect(() => {
    if (query) setOpen(true);
  }, [query]);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-shadow hover:shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
        aria-expanded={open}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${open ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
        <span className="min-w-0 flex-1 font-bold text-slate-900">{block.title}</span>
        {block.items && checkable && <span className="text-xs font-semibold text-slate-400">{block.items.length}단계</span>}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 sm:px-5 sm:py-5">
          {block.items && (
            <ul className="space-y-2.5">
              {block.items.map((item, index) => {
                const key = `${sectionId}-${block.title}-${index}`;
                const done = Boolean(checks[key]);
                return (
                  <li key={key}>
                    {checkable ? (
                      <button type="button" onClick={() => onCheck(key)} className="group flex w-full items-start gap-3 rounded-xl p-1 text-left">
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${done ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500"}`}>
                          {done ? <Check size={14} strokeWidth={3} /> : <Circle size={12} />}
                        </span>
                        <span className={`text-[15px] leading-6 transition-colors ${done ? "text-slate-400 line-through" : "text-slate-700"}`}>{item}</span>
                      </button>
                    ) : (
                      <div className="flex items-start gap-3 px-1">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                        <span className="text-[15px] leading-6 text-slate-700">{item}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {block.script && (
            <div className={`${block.items ? "mt-4" : ""} rounded-2xl bg-blue-50 px-4 py-4`}>
              <p className="mb-1.5 text-xs font-bold text-blue-600">이렇게 말해요</p>
              <p className="text-[15px] font-medium leading-6 text-slate-800">“{block.script}”</p>
            </div>
          )}
          {block.note && (
            <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-900">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>{block.note}</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function ManualPage() {
  const [authenticated, setAuthenticated] = useState(hasValidSession);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState("open-ready");
  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    try {
      if (localStorage.getItem(CHECK_DATE_KEY) !== todayKey()) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(CHECK_DATE_KEY, todayKey());
        return {};
      }
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    } catch { return {}; }
  });
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return manualSections.filter((section) => {
      const categoryMatch = Boolean(needle) || category === "all" || section.category === category;
      return categoryMatch && (!needle || normalize(searchableText(section)).includes(needle));
    });
  }, [category, query]);

  const selected = filtered.find((section) => section.id === selectedId) ?? filtered[0];

  useEffect(() => {
    if (filtered.length && !filtered.some((section) => section.id === selectedId)) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  useEffect(() => {
    const previousTitle = document.title;
    const previousRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobotsContent = previousRobots?.content;
    const createdRobots = !previousRobots;
    document.title = "RIORIO 직원 매뉴얼";
    let robots = previousRobots;
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = "noindex, nofollow, noarchive";
    return () => {
      document.title = previousTitle;
      if (createdRobots) robots?.remove();
      else if (robots && previousRobotsContent !== undefined) robots.content = previousRobotsContent;
    };
  }, []);

  const toggleCheck = (key: string) => {
    setChecks((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetTodayChecks = () => {
    localStorage.setItem(CHECK_DATE_KEY, todayKey());
    localStorage.removeItem(STORAGE_KEY);
    setChecks({});
  };

  const chooseSection = (id: string) => {
    setSelectedId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chooseCategory = (nextCategory: string, preferredSectionId?: string) => {
    setCategory(nextCategory);
    setQuery("");
    if (preferredSectionId) setSelectedId(preferredSectionId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthenticated(false);
  };

  if (!authenticated) return <ManualLogin onSuccess={() => setAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <a href="/manual" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#102c25] text-sm font-black text-white">R</span>
            <span className="hidden text-[15px] font-extrabold sm:inline">RIORIO 매뉴얼</span>
          </a>
          <div className="relative mx-auto w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="메뉴, 상황, 준비물을 검색해보세요"
              className="h-11 w-full rounded-2xl bg-slate-100 pl-11 pr-10 text-sm font-medium outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/30"
            />
            {query && <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200"><X size={17} /></button>}
          </div>
          <button type="button" onClick={logout} aria-label="로그아웃" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 md:hidden"><LogOut size={19} /></button>
          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-400"><Clock3 size={15} /> {manualUpdatedAt} 업데이트</span>
            <button type="button" onClick={logout} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100"><LogOut size={15} /> 로그아웃</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-slate-200 bg-white lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-r">
          <div className="border-b border-slate-100 px-4 py-4 lg:px-5">
            <p className="mb-3 px-1 text-xs font-bold text-slate-400">업무 상황</p>
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
              {categories.map((item) => (
                <button key={item.id} type="button" onClick={() => chooseCategory(item.id)} aria-pressed={category === item.id} className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold transition ${category === item.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{item.label}</button>
              ))}
            </div>
          </div>
          <nav className="hidden h-[calc(100%-115px)] overflow-y-auto p-3 lg:block" aria-label="매뉴얼 목록">
            {filtered.map((section) => (
              <button key={section.id} type="button" onClick={() => chooseSection(section.id)} className={`mb-1 w-full rounded-2xl px-4 py-3.5 text-left transition ${selected?.id === section.id ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}>
                <span className="block text-sm font-extrabold">{section.title}</span>
                <span className={`mt-1 block text-xs leading-5 ${selected?.id === section.id ? "text-blue-500" : "text-slate-400"}`}>{section.summary}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          {!query && (
            <section className="mb-6 grid grid-cols-2 gap-2.5 sm:mb-8 sm:grid-cols-4 sm:gap-3" aria-label="주요 매뉴얼 카테고리">
              <button type="button" onClick={() => chooseCategory("open", "open-ready")} aria-pressed={category === "open"} className={`rounded-2xl p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-lg sm:rounded-3xl sm:p-5 ${category === "open" ? "bg-[#102c25] text-white ring-2 ring-[#102c25] ring-offset-2" : "bg-white text-slate-900"}`}>
                <Sparkles size={21} className={`mb-3 sm:mb-5 ${category === "open" ? "text-[#d4bd75]" : "text-emerald-700"}`} /><p className="text-sm font-extrabold sm:text-lg">오픈 준비</p><p className={`mt-1 text-xs sm:text-sm ${category === "open" ? "text-white/60" : "text-slate-400"}`}>영업 전 체크리스트</p>
              </button>
              <button type="button" onClick={() => chooseCategory("menu", "main-menu")} aria-pressed={category === "menu"} className={`rounded-2xl p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-lg sm:rounded-3xl sm:p-5 ${category === "menu" ? "bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2" : "bg-white text-slate-900"}`}>
                <UtensilsCrossed size={21} className={`mb-3 sm:mb-5 ${category === "menu" ? "text-white" : "text-blue-600"}`} /><p className="text-sm font-extrabold sm:text-lg">메뉴 설명</p><p className={`mt-1 text-xs sm:text-sm ${category === "menu" ? "text-blue-100" : "text-slate-400"}`}>세팅과 고객 안내 문구</p>
              </button>
              <button type="button" onClick={() => chooseCategory("response", "complaint")} aria-pressed={category === "response"} className={`rounded-2xl p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-lg sm:rounded-3xl sm:p-5 ${category === "response" ? "bg-rose-600 text-white ring-2 ring-rose-600 ring-offset-2" : "bg-white text-slate-900"}`}>
                <AlertCircle size={21} className={`mb-3 sm:mb-5 ${category === "response" ? "text-white" : "text-rose-500"}`} /><p className="text-sm font-extrabold sm:text-lg">문제 대응</p><p className={`mt-1 text-xs sm:text-sm ${category === "response" ? "text-rose-100" : "text-slate-400"}`}>예약·컴플레인 대응</p>
              </button>
              <button type="button" onClick={() => chooseCategory("close", "hall-close")} aria-pressed={category === "close"} className={`rounded-2xl p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-lg sm:rounded-3xl sm:p-5 ${category === "close" ? "bg-slate-800 text-white ring-2 ring-slate-800 ring-offset-2" : "bg-white text-slate-900"}`}>
                <Check size={21} className={`mb-3 sm:mb-5 ${category === "close" ? "text-white" : "text-slate-600"}`} /><p className="text-sm font-extrabold sm:text-lg">마감</p><p className={`mt-1 text-xs sm:text-sm ${category === "close" ? "text-slate-300" : "text-slate-400"}`}>홀 정리와 최종 점검</p>
              </button>
            </section>
          )}

          {!query && category === "service" && (
            <button type="button" onClick={() => chooseSection("hospitality")} className="mb-6 flex w-full items-center gap-4 rounded-3xl bg-blue-600 p-5 text-left text-white shadow-sm transition hover:bg-blue-700 lg:hidden">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Sparkles size={22} /></span>
              <span><strong className="block text-base">서비스와 호스피탈리티부터 읽어보세요</strong><span className="mt-1 block text-sm text-blue-100">리오리오가 손님을 대하는 기본 기준</span></span>
            </button>
          )}

          {filtered.length > 0 && (
            <label className="mb-5 block lg:hidden">
              <span className="sr-only">매뉴얼 문서 선택</span>
              <select value={selected?.id ?? ""} onChange={(event) => chooseSection(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                {filtered.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
              </select>
            </label>
          )}

          {selected ? (
            <section className="mx-auto max-w-3xl">
              <div className="mb-7">
                {query && <p className="mb-3 text-sm font-bold text-blue-600">전체 매뉴얼에서 ‘{query}’ 검색 결과 {filtered.length}개</p>}
                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-400"><BookOpen size={15} /> RIORIO 홀 운영 매뉴얼</div>
                <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">{selected.title}</h1>
                <p className="mt-3 text-[16px] leading-7 text-slate-500">{selected.summary}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-400">{selected.mode === "checklist" ? "항목을 펼치고 오늘 완료한 일을 체크해보세요." : "항목을 눌러 자세한 내용을 확인해보세요."}</p>
                  {selected.mode === "checklist" && <button type="button" onClick={resetTodayChecks} className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200">오늘 초기화</button>}
                </div>
              </div>
              <div className="space-y-3">
                {selected.blocks
                  .filter((block) => !query || normalize(selected.title + selected.summary).includes(normalize(query)) || normalize(searchableBlockText(block)).includes(normalize(query)))
                  .map((block) => <BlockCard key={block.title} block={block} sectionId={selected.id} query={query} checkable={selected.mode === "checklist"} checks={checks} onCheck={toggleCheck} />)}
              </div>
              <div className="mt-8 rounded-3xl bg-slate-900 px-5 py-5 text-white sm:px-6">
                <p className="font-extrabold">찾는 내용이 없나요?</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">매뉴얼에서 빠진 내용은 인수인계 메모에 남기고 관리자에게 알려주세요.</p>
              </div>
            </section>
          ) : (
            <div className="mx-auto max-w-md py-24 text-center">
              <Search className="mx-auto text-slate-300" size={40} />
              <h1 className="mt-5 text-xl font-extrabold">검색 결과가 없어요</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">다른 표현으로 검색하거나 업무 상황을 전체로 바꿔보세요.</p>
              <button type="button" onClick={() => { setQuery(""); setCategory("all"); searchRef.current?.focus(); }} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">검색 초기화</button>
            </div>
          )}
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:hidden" aria-label="빠른 업무 이동">
        <button type="button" onClick={() => chooseCategory("open", "open-ready")} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold ${category === "open" && !query ? "bg-blue-50 text-blue-600" : "text-slate-500"}`}><Sparkles size={19} />오픈</button>
        <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); searchRef.current?.focus(); }} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold ${query ? "bg-blue-50 text-blue-600" : "text-slate-500"}`}><Search size={19} />검색</button>
        <button type="button" onClick={() => chooseCategory("menu", "main-menu")} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold ${category === "menu" && !query ? "bg-blue-50 text-blue-600" : "text-slate-500"}`}><UtensilsCrossed size={19} />메뉴</button>
        <button type="button" onClick={() => chooseCategory("close", "hall-close")} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold ${category === "close" && !query ? "bg-blue-50 text-blue-600" : "text-slate-500"}`}><Check size={19} />마감</button>
      </nav>
    </div>
  );
}
