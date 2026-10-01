"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarCheck, Camera, CheckCircle2, Clock, QrCode, ScanLine, UserX, X } from "lucide-react";
import { attendanceApi, qrApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { usePortal } from "@/lib/student";
import { Fmt, parseDate } from "@/lib/fmt";
import { friendlyError } from "@/lib/errors";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/types";
import { Async, Badge, Button, Card, Modal, PageHeader, Ring, StatCard, TONE_HEX } from "@/components/ui";

export default function StudentAttendance() {
  const { data } = usePortal();
  const state = useAsync(() => attendanceApi.history({ studentId: data.student.id, limit: 200 }), [data.student.id]);
  const [scan, setScan] = useState(false);

  return (
    <>
      <PageHeader title="حضوري" icon={CalendarCheck} subtitle="سجل حضورك في كل الحصص" actions={<Button icon={QrCode} onClick={() => setScan(true)}>تسجيل الحضور بالـ QR</Button>} />
      <Async state={state}>
        {(rows) => {
          const c = { present: 0, absent: 0, late: 0, excused: 0 };
          rows.forEach((r) => c[r.status]++);
          const total = c.present + c.absent + c.late;
          const pct = total ? ((c.present + c.late) / total) * 100 : 0;
          return (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="flex items-center gap-4">
                  <Ring value={pct} size={76} stroke={8} color={pct >= 75 ? TONE_HEX.success : TONE_HEX.danger}><span className="font-black">{Math.round(pct)}%</span></Ring>
                  <div><div className="font-extrabold">نسبة الحضور</div><div className="text-sm text-muted">{total} حصة</div></div>
                </Card>
                <StatCard label="حاضر" value={c.present} icon={CheckCircle2} tone="success" />
                <StatCard label="متأخر" value={c.late} icon={Clock} tone="warning" />
                <StatCard label="غائب" value={c.absent} icon={UserX} tone="danger" />
              </div>
              {rows.length === 0 ? <Card className="py-10 text-center text-muted">لا يوجد سجل حضور بعد</Card> : (
                <div className="grid gap-3 md:grid-cols-2">
                  {rows.map((r) => (
                    <Card key={r.id} className="flex items-center gap-4 !p-4">
                      <div className="grid size-12 place-items-center rounded-2xl text-center" style={{ background: `${TONE_HEX[STATUS_TONE[r.status]]}1a`, color: TONE_HEX[STATUS_TONE[r.status]] }}>
                        <div><div className="text-lg font-black leading-none">{parseDate(r.date).getDate()}</div><div className="text-[10px] font-bold">{Fmt.monthName(parseDate(r.date).getMonth() + 1)}</div></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-extrabold">{r.classes?.name}</div>
                        <div className="text-sm text-muted">{Fmt.weekday(parseDate(r.date))}{r.note ? ` • ${r.note}` : ""}</div>
                      </div>
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </Card>
                  ))}
                </div>
              )}
            </>
          );
        }}
      </Async>
      {scan && <ScanModal onClose={() => setScan(false)} onDone={state.reload} />}
    </>
  );
}

function ScanModal({ onClose, onDone }: { onClose(): void; onDone(): void }) {
  const { settings } = useAuth();
  const [status, setStatus] = useState<"starting" | "scanning" | "sending" | "done" | "error">("starting");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ status: keyof typeof STATUS_LABEL; class_name: string } | null>(null);
  const scannerRef = useRef<{ stop(): Promise<void>; isScanning?: boolean } | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const s = new Html5Qrcode("qr-reader");
        scannerRef.current = s;
        await s.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } }, async (text) => {
          if (handled.current) return;
          handled.current = true;
          setStatus("sending");
          await s.stop().catch(() => {});
          try {
            let lat: number | undefined, lng: number | undefined;
            if (settings?.geofence_enabled) {
              const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 15000 }));
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
            }
            const r = await qrApi.scan(text, lat, lng);
            setResult(r);
            setStatus("done");
            onDone();
          } catch (e) {
            const msg = e instanceof GeolocationPositionError ? "يجب السماح بالوصول للموقع لتسجيل الحضور" : friendlyError(e);
            setMessage(msg);
            setStatus("error");
          }
        }, () => {});
        if (!cancelled) setStatus("scanning");
      } catch {
        if (!cancelled) {
          setMessage("تعذر فتح الكاميرا. اسمح للمتصفح باستخدام الكاميرا ثم أعد المحاولة.");
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => {});
    };
  }, [settings?.geofence_enabled, onDone]);

  return (
    <Modal open onClose={onClose} title="مسح رمز الحضور">
      {status === "done" && result ? (
        <div className="py-6 text-center animate-in">
          <div className="mx-auto grid size-24 place-items-center rounded-full bg-success/15"><CheckCircle2 className="size-14 text-success" /></div>
          <h3 className="mt-4 text-2xl font-black">تم تسجيل حضورك 🎉</h3>
          <p className="mt-2 text-muted">{result.class_name}</p>
          <div className="mt-3"><Badge tone={STATUS_TONE[result.status]}>{STATUS_LABEL[result.status]}</Badge></div>
          <Button className="mt-6" onClick={onClose}>تم</Button>
        </div>
      ) : status === "error" ? (
        <div className="py-6 text-center">
          <div className="mx-auto grid size-24 place-items-center rounded-full bg-danger/15"><X className="size-14 text-danger" /></div>
          <p className="mt-4 font-bold">{message}</p>
          <Button className="mt-6" variant="outline" onClick={onClose}>إغلاق</Button>
        </div>
      ) : (
        <div>
          <div className="relative overflow-hidden rounded-3xl bg-black">
            <div id="qr-reader" className="aspect-square w-full [&_video]:!h-full [&_video]:!w-full [&_video]:object-cover" />
            {status !== "scanning" && <div className="absolute inset-0 grid place-items-center text-white"><Camera className="size-10 animate-pulse" /></div>}
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm font-semibold text-muted">
            <ScanLine className="size-4" /> {status === "sending" ? "جاري التحقق..." : "وجّه الكاميرا نحو رمز QR المعروض على شاشة المدرس"}
          </p>
        </div>
      )}
    </Modal>
  );
}
