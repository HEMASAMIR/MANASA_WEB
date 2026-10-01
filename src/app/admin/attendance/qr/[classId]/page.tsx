"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, Maximize2, QrCode, Square, Users } from "lucide-react";
import { attendanceApi, classApi, qrApi } from "@/lib/api";
import { sb } from "@/lib/supabase";
import { Fmt } from "@/lib/fmt";
import { friendlyError } from "@/lib/errors";
import { STATUS_LABEL, STATUS_TONE, type AttendanceRecord, type ClassRow, type Student } from "@/lib/types";
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, Field, PageHeader, Select, Spinner, useUi } from "@/components/ui";

export default function QrKiosk() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const { toast } = useUi();
  const [cls, setCls] = useState<ClassRow | null>(null);
  const [roster, setRoster] = useState<Student[]>([]);
  const [minutes, setMinutes] = useState(90);
  const [session, setSession] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [left, setLeft] = useState(5);
  const boxRef = useRef<HTMLDivElement>(null);
  const today = Fmt.isoDate();

  useEffect(() => {
    classApi.list().then((l) => setCls(l.find((c) => c.id === classId) ?? null)).catch(() => {});
    classApi.roster(classId).then(setRoster).catch(() => {});
  }, [classId]);

  const loadRecords = useCallback(() => attendanceApi.forClassDate(classId, today).then(setRecords).catch(() => {}), [classId, today]);

  useEffect(() => {
    loadRecords();
    const ch = sb().channel(`qr-att-${classId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records", filter: `class_id=eq.${classId}` }, loadRecords)
      .subscribe();
    const t = setInterval(loadRecords, 15000);
    return () => { sb().removeChannel(ch); clearInterval(t); };
  }, [classId, loadRecords]);

  // Rotate the signed token every few seconds.
  useEffect(() => {
    if (!session) return;
    let alive = true;
    const tick = async () => {
      try {
        const t = await qrApi.token(session);
        if (alive) { setToken(t); setLeft(5); }
      } catch (e) {
        if (alive) { setError(friendlyError(e)); setSession(null); setToken(null); }
      }
    };
    tick();
    const t = setInterval(tick, 4000);
    const c = setInterval(() => setLeft((l) => (l > 1 ? l - 1 : 1)), 1000);
    return () => { alive = false; clearInterval(t); clearInterval(c); };
  }, [session]);

  const start = async () => {
    setError(null);
    setStarting(true);
    try {
      setSession(await qrApi.start(classId, minutes));
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setStarting(false);
    }
  };

  const stop = async () => {
    if (session) await qrApi.end(session).catch(() => {});
    setSession(null);
    setToken(null);
    toast("تم إنهاء جلسة الحضور");
  };

  useEffect(() => () => { if (session) qrApi.end(session).catch(() => {}); }, [session]);

  const names = new Map(roster.map((s) => [s.id, s]));
  const attended = records.filter((r) => r.status === "present" || r.status === "late");

  return (
    <>
      <PageHeader
        title={`حضور بالـ QR${cls ? ` — ${cls.name}` : ""}`}
        icon={QrCode}
        subtitle="الرمز يتغير كل 5 ثوانٍ ويُتحقق منه على السيرفر، فلا يمكن تصويره وإرساله"
        actions={<Button variant="outline" icon={ArrowRight} onClick={() => router.push(`/admin/attendance?class=${classId}`)}>رجوع للكشف</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card className="flex flex-col items-center justify-center !p-8 text-center">
          {!session ? (
            <div className="w-full max-w-sm">
              <div className="mx-auto grid size-24 place-items-center rounded-[28px] bg-primary-soft text-primary"><QrCode className="size-12" /></div>
              <h2 className="mt-5 text-xl font-black">ابدأ جلسة حضور</h2>
              <p className="mt-2 text-sm text-muted">اعرض الشاشة للطلاب ليمسحوها من تطبيق الطالب أو من موقع الطالب</p>
              <Field label="مدة الجلسة" className="mt-6 text-start">
                <Select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                  {[30, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m} دقيقة</option>)}
                </Select>
              </Field>
              {error && <div className="mt-4"><ErrorState message={error} /></div>}
              <Button size="lg" className="mt-5 w-full" loading={starting} icon={QrCode} onClick={start}>بدء الجلسة</Button>
            </div>
          ) : (
            <div ref={boxRef} className="flex w-full flex-col items-center bg-surface p-4">
              <div className="rounded-[32px] bg-white p-6 shadow-[0_20px_50px_-20px_rgba(91,76,245,0.6)] ring-8 ring-primary/10">
                {token ? <QRCodeSVG value={token} size={320} level="M" marginSize={1} fgColor="#1e1b4b" /> : <div className="grid size-80 place-items-center"><Spinner /></div>}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <span className="relative flex size-3"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex size-3 rounded-full bg-success" /></span>
                <span className="font-bold">الجلسة نشطة • يتجدد خلال {left} ث</span>
              </div>
              <div className="mt-2 text-4xl font-black text-primary">{attended.length} <span className="text-lg text-muted">/ {roster.length} سجلوا حضورهم</span></div>
              <div className="mt-6 flex gap-2 no-print">
                <Button variant="outline" icon={Maximize2} onClick={() => boxRef.current?.requestFullscreen?.()}>ملء الشاشة</Button>
                <Button variant="danger" icon={Square} onClick={stop}>إنهاء الجلسة</Button>
              </div>
            </div>
          )}
        </Card>

        <Card padded={false}>
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <Users className="size-5 text-primary" />
            <h3 className="flex-1 font-extrabold">حضور اليوم ({records.length})</h3>
            <Link href={`/admin/attendance?class=${classId}`} className="text-sm font-bold text-primary">فتح الكشف</Link>
          </div>
          <div className="max-h-[560px] overflow-y-auto p-3">
            {records.length === 0 ? <EmptyState icon={Users} message="لم يسجل أحد بعد" /> : [...records]
              .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
              .map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl p-2.5 animate-in hover:bg-surface-2">
                  <Avatar name={names.get(r.student_id)?.name ?? "?"} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{names.get(r.student_id)?.name ?? "طالب"}</div>
                    <div className="text-xs text-muted">{Fmt.dateTime(r.recorded_at)} • {r.method === "manual" ? "يدوي" : "QR"}</div>
                  </div>
                  <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </>
  );
}
