"use client";

import Link from "next/link";
import { BellRing, CalendarCheck, CheckCircle2, Clock, CreditCard, GraduationCap, MessageCircle, UserX, Users, BadgeCheck, ArrowLeft } from "lucide-react";
import { classApi, reportApi, studentApi, notificationApi, classNames } from "@/lib/api";
import { useAuth, useStaffPerms } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { Fmt, whatsappLink } from "@/lib/fmt";
import { Async, Avatar, Badge, Card, EmptyState, IconBadge, SectionTitle, StatCard, TONE_HEX, useUi } from "@/components/ui";

export default function Overview() {
  const { profile, settings } = useAuth();
  const perms = useStaffPerms();
  const { run } = useUi();
  const threshold = settings?.absence_warning_count ?? 2;
  const critical = settings?.absence_critical_count ?? 5;
  const currency = settings?.currency ?? "ج.م";

  const state = useAsync(async () => {
    const [stats, classes, atRisk] = await Promise.all([reportApi.stats(), classApi.list(), studentApi.listAtRisk(threshold, 20)]);
    const wd = new Date().getDay();
    const today = classes
      .filter((c) => c.class_schedule?.some((s) => s.weekday === wd))
      .map((c) => ({ c, slots: c.class_schedule!.filter((s) => s.weekday === wd).sort((a, b) => a.start_time.localeCompare(b.start_time)) }))
      .sort((a, b) => a.slots[0].start_time.localeCompare(b.slots[0].start_time));
    return { stats, today, atRisk };
  }, [threshold]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 18 ? "مساء النور" : "مساء الخير";

  return (
    <Async state={state}>
      {({ stats: s, today, atRisk }) => (
        <>
          {/* Welcome banner */}
          <div className="relative mb-6 overflow-hidden rounded-[28px] bg-hero p-6 text-white shadow-[0_20px_40px_-18px_rgba(13,148,136,0.8)] animate-in md:p-8">
            <div className="absolute -top-16 -end-10 size-56 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 end-40 size-40 rounded-full bg-white/[0.06]" />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
              <div>
                <div className="text-sm font-semibold text-white/80">{Fmt.weekday(now)} {Fmt.date(now)}</div>
                <h1 className="mt-1 text-3xl font-black md:text-4xl">{greeting}، {profile?.name} 👋</h1>
                <p className="mt-2 text-white/85">إليك ملخص يومك في المركز</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-sm font-bold"><CalendarCheck className="size-4" />{today.length} حصص اليوم</span>
                  <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-sm font-bold"><CheckCircle2 className="size-4" />{s.present_today} حاضر</span>
                  <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-sm font-bold"><UserX className="size-4" />{s.absent_today} غائب</span>
                </div>
              </div>
              {perms.canTakeAttendance && (
                <Link href="/admin/attendance" className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-extrabold text-primary-2 shadow-xl transition hover:-translate-y-0.5">
                  تسجيل الحضور <ArrowLeft className="size-5" />
                </Link>
              )}
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
                        <div className="truncate font-extrabold">{c.name}</div>
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
