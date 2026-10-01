"use client";

import { useEffect, useState } from "react";
import { Bell, Building2, MapPin, Save, Settings } from "lucide-react";
import { settingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AppSettings } from "@/lib/types";
import { Button, Card, Field, Input, LoadingBlock, PageHeader, Switch, useUi } from "@/components/ui";

export default function SettingsPage() {
  const { settings, refresh } = useAuth();
  const { run, toast } = useUi();
  const [f, setF] = useState<AppSettings | null>(settings);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (settings && !f) setF(settings); }, [settings, f]);
  if (!f) return <LoadingBlock />;

  const num = (k: keyof AppSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value === "" ? null : Number(e.target.value) });
  const str = (k: keyof AppSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const locate = () => {
    if (!navigator.geolocation) return toast("المتصفح لا يدعم تحديد الموقع", "error");
    navigator.geolocation.getCurrentPosition(
      (p) => { setF({ ...f, campus_lat: Number(p.coords.latitude.toFixed(6)), campus_lng: Number(p.coords.longitude.toFixed(6)) }); toast("تم تحديد الموقع الحالي"); },
      () => toast("تعذر تحديد الموقع، اسمح للمتصفح بالوصول للموقع", "error"),
      { enableHighAccuracy: true },
    );
  };

  const save = async () => {
    if (!f.center_name.trim()) return toast("اسم المركز مطلوب", "error");
    if (!/^[0-9]{1,4}$/.test(f.country_code)) return toast("كود الدولة غير صحيح (أرقام فقط مثل 20)", "error");
    setBusy(true);
    await run(async () => {
      await settingsApi.save({
        center_name: f.center_name.trim(), logo_url: f.logo_url?.trim() || null, contact_phone: f.contact_phone?.trim() || null, currency: f.currency.trim() || "ج.م",
        country_code: f.country_code, timezone: f.timezone.trim(), campus_lat: f.campus_lat, campus_lng: f.campus_lng, campus_radius_m: f.campus_radius_m,
        geofence_enabled: f.geofence_enabled, late_after_minutes: f.late_after_minutes, absence_warning_count: f.absence_warning_count,
        absence_danger_count: f.absence_danger_count, absence_critical_count: f.absence_critical_count,
      });
      await refresh();
    }, "تم حفظ الإعدادات");
    setBusy(false);
  };

  return (
    <>
      <PageHeader title="إعدادات المركز" icon={Settings} actions={<Button icon={Save} loading={busy} onClick={save}>حفظ الإعدادات</Button>} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold"><Building2 className="size-5 text-primary" /> بيانات المركز</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم المركز" className="sm:col-span-2"><Input value={f.center_name} onChange={str("center_name")} /></Field>
            <Field label="رابط الشعار (اختياري)" className="sm:col-span-2"><Input dir="ltr" className="text-start" value={f.logo_url ?? ""} onChange={str("logo_url")} /></Field>
            <Field label="رقم التواصل"><Input dir="ltr" className="text-start" value={f.contact_phone ?? ""} onChange={str("contact_phone")} /></Field>
            <Field label="العملة"><Input value={f.currency} onChange={str("currency")} /></Field>
            <Field label="كود الدولة (لروابط واتساب)" hint="مصر 20، السعودية 966"><Input dir="ltr" className="text-start" value={f.country_code} onChange={str("country_code")} /></Field>
            <Field label="المنطقة الزمنية"><Input dir="ltr" className="text-start" value={f.timezone} onChange={str("timezone")} /></Field>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold"><Bell className="size-5 text-primary" /> الحضور والتنبيهات</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="يعتبر متأخراً بعد (دقيقة)"><Input type="number" min={0} value={f.late_after_minutes} onChange={num("late_after_minutes")} /></Field>
            <Field label="تنبيه الغياب بعد (مرات)"><Input type="number" min={1} value={f.absence_warning_count} onChange={num("absence_warning_count")} /></Field>
            <Field label="غياب خطر (مرات)"><Input type="number" min={1} value={f.absence_danger_count} onChange={num("absence_danger_count")} /></Field>
            <Field label="غياب حرج (مرات)"><Input type="number" min={1} value={f.absence_critical_count} onChange={num("absence_critical_count")} /></Field>
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold"><MapPin className="size-5 text-primary" /> التحقق من الموقع عند الحضور بالـ QR</h2>
          <Switch checked={f.geofence_enabled} onChange={(v) => setF({ ...f, geofence_enabled: v })} label="لا يُقبل الحضور إلا إذا كان الطالب داخل نطاق المركز" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="خط العرض"><Input type="number" step="any" dir="ltr" value={f.campus_lat ?? ""} onChange={num("campus_lat")} /></Field>
            <Field label="خط الطول"><Input type="number" step="any" dir="ltr" value={f.campus_lng ?? ""} onChange={num("campus_lng")} /></Field>
            <Field label="نصف القطر (متر)"><Input type="number" min={10} max={50000} value={f.campus_radius_m} onChange={num("campus_radius_m")} /></Field>
            <div className="flex items-end"><Button variant="secondary" icon={MapPin} className="w-full" onClick={locate}>استخدم موقعي الحالي</Button></div>
          </div>
          {f.campus_lat != null && f.campus_lng != null && (
            <a className="mt-3 inline-block text-sm font-bold text-primary hover:underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${f.campus_lat},${f.campus_lng}`}>عرض الموقع على الخريطة ↗</a>
          )}
        </Card>
      </div>
    </>
  );
}
