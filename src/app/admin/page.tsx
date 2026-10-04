"use client";

import Link from "next/link";
import { BellRing, CalendarCheck, CheckCircle2, Clock, CreditCard, GraduationCap, MessageCircle, UserX, Users, BadgeCheck, ArrowLeft, UserPlus, ListChecks, Megaphone, BookOpen, QrCode, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { classApi, reportApi, studentApi, notificationApi, classNames } from "@/lib/api";
import { useAuth, useStaffPerms } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { Fmt, parseDate, whatsappLink } from "@/lib/fmt";
import { Async, Avatar, Badge, Card, EmptyState, IconBadge, Ring, SectionTitle, StatCard, TONE_HEX, useUi } from "@/components/ui";
import { CountUp, LiveClock } from "@/components/fx";
import { CurriculumBadges } from "@/components/curriculum";
import { SYSTEMS, STAGES, parseStudentGrade } from "@/lib/curriculum";

export default function Overview() {
  const { profile, settings } = useAuth();
  const perms = useStaffPerms();
  const { run } = useUi();
  const threshold = settings?.absence_warning_count ?? 2;
  const critical = settings?.absence_critical_count ?? 5;
  const currency = settings?.currency ?? "ج.م";

  const state = useAsync(async () => {
    const [stats, classes, atRisk, trend, grades] = await Promise.all([reportApi.stats(), classApi.list(), studentApi.listAtRisk(threshold, 20), reportApi.trend(undefined, 14).catch(() => []), studentApi.activeGrades().catch(() => [] as string[])]);
    const wd = new Date().getDay();
    const today = classes
      .filter((c) => c.class_schedule?.some((s) => s.weekday === wd))
      .map((c) => ({ c, slots: c.class_schedule!.filter((s) => s.weekday === wd).sort((a, b) => a.start_time.localeCompare(b.start_time)) }))
      .sort((a, b) => a.slots[0].start_time.localeCompare(b.slots[0].start_time));
    return { stats, today, atRisk, trend, grades };
  }, [threshold]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 18 ? "مساء النور" : "مساء الخير";
  const nowHm = `${String(hour).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <Async state={state}>
      {({ stats: s, today, atRisk, trend, grades }) => (
        <>
          {/* Welcome banner */}
          <div className="glow-border relative mb-6 overflow-hidden rounded-[28px] bg-hero p-6 text-white shadow-[0_20px_40px_-18px_rgba(13,148,136,0.8)] animate-in md:p-8">
            <div className="aurora opacity-50" />
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            <div className="absolute -top-16 -end-10 size-56 rounded-full bg-white/10" />
            <div aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
              {[["📚", "top-6 end-[34%]", "0s"], ["🎓", "bottom-6 end-[44%]", "-4s"], ["✨", "top-10 end-[52%]", "-8s"]].map(([e, pos, d]) => (
                <span key={e} className={`orbit absolute grid size-11 place-items-center rounded-2xl border border-white/20 bg-white/10 text-xl backdrop-blur ${pos}`} style={{ animationDelay: d }}>{e}</span>
              ))}
            </div>
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-white/80">
                  <span>{Fmt.weekday(now)} {Fmt.date(now)}</span>
                  <span className="rounded-full bg-white/15 px-3 py-0.5 text-base font-black text-white"><LiveClock /></span>
                </div>
                <h1 className="mt-1 text-3xl font-black md:text-4xl">{greeting}، <span className="shimmer-text">{profile?.name}</span> 👋</h1>
                <p className="mt-2 text-white/85">إليك ملخص يومك في المركز</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-sm font-bold"><CalendarCheck className="size-4" />{today.length} حصص اليوم</span>
                  <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-sm font-bold"><CheckCircle2 className="size-4" />{s.present_today} حاضر</span>
                  <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-sm font-bold"><UserX className="size-4" />{s.absent_today} غائب</span>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center gap-1.5">
                  <Ring value={s.present_today + s.absent_today ? (s.present_today / (s.present_today + s.absent_today)) * 100 : 0} size={104} stroke={10} color="#fbbf24" track="rgba(255,255,255,0.15)">
                    <div className="text-center">
                      <div className="text-2xl font-black"><CountUp value={s.present_today + s.absent_today ? Math.round((s.present_today / (s.present_today + s.absent_today)) * 100) : 0} />%</div>
                    </div>
                  </Ring>
                  <span className="text-xs font-bold text-white/80">نسبة حضور اليوم</span>
                </div>
                {perms.canTakeAttendance && (
                  <Link href="/admin/attendance" className="bg-gold glow-gold shimmer-auto inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-extrabold text-navy transition hover:-translate-y-0.5">
                    تسجيل الحضور <ArrowLeft className="size-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="الطلاب النشطون" value={s.students} icon={GraduationCap} />
            <StatCard label="المجموعات" value={s.classes} icon={Users} tone="info" />
            <StatCard label="حضور اليوم" value={s.present_today} icon={CheckCircle2} tone="success" />
            <StatCard label="غياب اليوم" value={s.absent_today} icon={UserX} tone="danger" />
            {perms.isAdmin && <StatCard label="المدرسون والمساعدون" value={s.teachers} icon={BadgeCheck} tone="warning" />}
            {perms.canSeeFinance && <StatCard label="إيرادات الشهر" value={Fmt.money(s.revenue_month, currency)} icon={CreditCard} tone="success" hint={`الإجمالي: ${Fmt.money(s.revenue, currency)}`} />}
          </div>

          {/* Quick actions */}
          <SectionTitle>إجراءات سريعة</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" data-reveal-stagger="70" data-reveal-child="zoom">
            {[
              { show: perms.canManage, href: "/admin/students", icon: UserPlus, label: "إضافة طالب", c: "#0D9488" },
              { show: perms.canTakeAttendance, href: "/admin/attendance", icon: CheckCircle2, label: "تسجيل الحضور", c: "#10B981" },
              { show: perms.canTakeAttendance && today.length > 0, href: today[0] ? `/admin/attendance/qr/${today[0].c.id}` : "/admin/attendance", icon: QrCode, label: "حضور بالـ QR", c: "#0E2C4E" },
              { show: perms.canGrade, href: "/admin/exams", icon: ListChecks, label: "امتحان جديد", c: "#F59E0B" },
              { show: perms.canManage, href: "/admin/courses", icon: BookOpen, label: "كورس جديد", c: "#8B5CF6" },
              { show: perms.canSeeFinance, href: "/admin/finance", icon: CreditCard, label: "المالية", c: "#0EA5E9" },
              { show: perms.canManage, href: "/admin/broadcast", icon: Megaphone, label: "إشعار جماعي", c: "#E11D48" },
            ].filter((a) => a.show).slice(0, 6).map((a) => (
              <div key={a.label}>
              <Link href={a.href} data-tilt="12" className="spotlight group relative flex h-full flex-col items-center gap-3 overflow-hidden rounded-3xl border border-line bg-surface p-5 text-center shadow-soft transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-[0_20px_40px_-18px_rgba(15,23,42,0.25)]"
                style={{ "--spot": `${a.c}22` } as React.CSSProperties}>
                <span className="absolute inset-x-0 top-0 h-1 opacity-0 transition group-hover:opacity-100" style={{ background: a.c }} />
                <span className="wiggle grid size-14 place-items-center rounded-2xl text-white shadow-lg transition group-hover:scale-110" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${a.c} 75%, white), ${a.c})`, boxShadow: `0 10px 22px -10px ${a.c}` }}>
                  <a.icon className="size-6" />
                </span>
                <span className="text-sm font-extrabold">{a.label}</span>
              </Link>
              </div>
            ))}
          </div>

          <TracksWidget grades={grades} canManage={perms.canManage} />

          {/* Attendance trend */}
          {trend.length > 0 && (
            <Card className="mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-extrabold"><TrendingUp className="size-5 text-primary" /> الحضور خلال آخر 14 يوم</h3>
                <div className="flex gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-success" />حاضر</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-warning" />متأخر</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-danger" />غائب</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend.map((d) => ({ ...d, label: `${parseDate(d.date).getDate()}/${parseDate(d.date).getMonth() + 1}` }))} margin={{ left: 0, right: 0, top: 5 }}>
                    <defs>
                      <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.35} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                      <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E11D48" stopOpacity={0.3} /><stop offset="100%" stopColor="#E11D48" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" reversed tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis orientation="right" allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, color: "var(--ink)" }} />
                    <Area type="monotone" dataKey="present" name="حاضر" stroke="#10B981" strokeWidth={3} fill="url(#gp)" />
                    <Area type="monotone" dataKey="late" name="متأخر" stroke="#F59E0B" strokeWidth={2} fill="transparent" />
                    <Area type="monotone" dataKey="absent" name="غائب" stroke="#E11D48" strokeWidth={2} fill="url(#ga)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <div>
              <SectionTitle>حصص اليوم ({today.length})</SectionTitle>
              {today.length === 0 ? (
                <Card><EmptyState icon={CalendarCheck} message="لا توجد حصص مجدولة اليوم" /></Card>
              ) : (
                <div className="space-y-3">
                  {today.map(({ c, slots }) => (
                    <Card key={c.id} className="flex items-center gap-4 !p-4">
                      <IconBadge icon={Clock} color={TONE_HEX.info} size={46} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate font-extrabold">{c.name}</span>
                          {slots.some((x) => x.start_time.slice(0, 5) <= nowHm && nowHm < x.end_time.slice(0, 5)) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-black text-danger"><span className="ping-dot size-1.5 rounded-full bg-danger" /> الآن</span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1"><CurriculumBadges grade={c.grade} subject={c.subject} size="xs" /></div>
                        <div className="text-sm text-muted">{slots.map((x) => `${Fmt.time12(x.start_time)} - ${Fmt.time12(x.end_time)}`).join(" • ")}{c.room ? ` • ${c.room}` : ""}</div>
                      </div>
                      {perms.canTakeAttendance && (
                        <Link href={`/admin/attendance?class=${c.id}`} className="rounded-xl bg-primary-soft px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20">تسجيل الحضور</Link>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <SectionTitle>تنبيهات الغياب المتكرر ({atRisk.length})</SectionTitle>
              {atRisk.length === 0 ? (
                <Card><EmptyState icon={CheckCircle2} message="لا يوجد طلاب تجاوزوا حد التنبيه 👏" /></Card>
              ) : (
                <div className="space-y-3">
                  {atRisk.slice(0, 10).map((st) => {
                    const n = st.stats?.absent_count ?? 0;
                    const tone = n >= critical ? "danger" : "warning";
                    const wa = whatsappLink(st.student.parent_phone,
                      `السلام عليكم، نود إبلاغكم بأن ${st.student.name} تغيب ${n} مرات عن ${classNames(st)}. نرجو التواصل معنا — ${settings?.center_name ?? ""}`,
                      settings?.country_code);
                    return (
                      <Card key={st.student.id} className="flex items-center gap-3 !p-4">
                        <Link href={`/admin/students/${st.student.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                          <Avatar name={st.student.name} />
                          <div className="min-w-0">
                            <div className="truncate font-extrabold">{st.student.name}</div>
                            <div className="truncate text-sm text-muted">{classNames(st)}</div>
                          </div>
                        </Link>
                        <Badge tone={tone}>غاب {n} مرات</Badge>
                        {perms.canContactParents && (
                          <>
                            <button
                              title="إشعار ولي الأمر"
                              onClick={() => run(() => notificationApi.sendNote(st.student.id, `تنبيه غياب: ${st.student.name}`, `نود إحاطتكم بأن ${st.student.name} تغيب ${n} مرات. نرجو التواصل مع الإدارة.`), "تم إرسال التنبيه لولي الأمر")}
                              className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary hover:bg-primary/20 cursor-pointer"
                            >
                              <BellRing className="size-5" />
                            </button>
                            {wa && <a href={wa} target="_blank" rel="noreferrer" title="واتساب" className="grid size-10 place-items-center rounded-xl bg-success/10 text-success hover:bg-success/20"><MessageCircle className="size-5" /></a>}
                          </>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Async>
  );
}

/** How the center's active students split across Baccalaureate tracks and Thanaweya Amma branches. */
function TracksWidget({ grades, canManage }: { grades: string[]; canManage: boolean }) {
  if (!grades.length) return null;
  const rows: { key: string; label: string; emoji: string; color: string; n: number; sys: string }[] = [];
  const add = (key: string, label: string, emoji: string, color: string, sys: string) => {
    const row = rows.find((x) => x.key === key);
    if (row) row.n++;
    else rows.push({ key, label, emoji, color, n: 1, sys });
  };
  for (const g of grades) {
    const { stage, track } = parseStudentGrade(g);
    if (!stage) add("other", "صفوف أخرى", "📘", "#94a3b8", "other");
    else if (track) add(`${stage.id}:${track.id}`, `${track.name} — ${stage.short}`, track.emoji, track.color, stage.system);
    else { const sys = SYSTEMS.find((x) => x.id === stage.system)!; add(stage.id, stage.short, sys.emoji, sys.color, stage.system); }
  }
  const order = (k: string) => { const i = STAGES.findIndex((s) => k.startsWith(s.id)); return i < 0 ? 99 : i; };
  rows.sort((a, b) => order(b.key) - order(a.key) || b.n - a.n);
  const total = grades.length;
  const bySystem = SYSTEMS.map((s) => ({ s, n: rows.filter((x) => x.sys === s.id).reduce((a, x) => a + x.n, 0) })).filter((x) => x.n);
  const main = [...bySystem].sort((a, b) => b.n - a.n)[0];

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface-2/60 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-hero text-xl text-white shadow-lg">🎓</span>
          <div>
            <h3 className="text-lg font-extrabold">طلابك حسب المسار</h3>
            <p className="text-sm text-muted">{bySystem.map((x) => x.s.name).join(" • ") || "صفوف المركز"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {main && (
            <>
              <div className="text-center"><div className="text-2xl font-black text-primary"><CountUp value={main.n} /></div><div className="text-[11px] font-bold text-muted">{main.s.emoji} {main.s.name}</div></div>
              <div className="h-10 w-px bg-line" />
            </>
          )}
          <div className="text-center"><div className="text-2xl font-black"><CountUp value={total} /></div><div className="text-[11px] font-bold text-muted">طالب نشط</div></div>
          {canManage && <Link href="/admin/classes" className="hidden rounded-xl bg-brand px-4 py-2.5 text-sm font-black text-white shadow-lg sm:block">مجموعة جديدة</Link>}
        </div>
      </div>
      <div className="p-5">
        <div className="flex h-4 overflow-hidden rounded-full bg-surface-3" dir="rtl">
          {rows.map((x) => (
            <div key={x.key} title={x.label} className="grow-x h-full first:rounded-s-full last:rounded-e-full" style={{ width: `${(x.n / total) * 100}%`, background: x.color }} />
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((x) => (
            <div key={x.key} className="group flex items-center gap-3 rounded-2xl border border-line p-3 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl text-xl transition-transform group-hover:scale-110" style={{ background: `${x.color}1f` }}>{x.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-extrabold">{x.label}</span>
                  <span className="text-sm font-black" style={{ color: x.color }}><CountUp value={x.n} /></span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className="grow-x h-full rounded-full" style={{ width: `${(x.n / total) * 100}%`, background: x.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
