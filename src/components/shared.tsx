"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell, BookOpen, CalendarClock, CheckCheck, GraduationCap, KeyRound, Megaphone, MessageCircle, Phone, Save, Search, Send, Trash2,
  TriangleAlert, User, ArrowRight,
} from "lucide-react";
import { chatApi, notificationApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { Fmt, whatsappLink } from "@/lib/fmt";
import { sb } from "@/lib/supabase";
import { friendlyError } from "@/lib/errors";
import { ROLE_LABEL, type ChatContact, type ClassRow, type MessageRow, type NotificationRow } from "@/lib/types";
import { Async, Avatar, Button, Card, EmptyState, Field, IconBadge, Input, PageHeader, Select, Spinner, TONE_HEX, Tabs, cx, useUi } from "./ui";

// ─── Class picker ────────────────────────────────────────────────────────────
export function ClassSelect({ classes, value, onChange, allLabel, className }: {
  classes: Pick<ClassRow, "id" | "name">[]; value: string | null; onChange(v: string | null): void; allLabel?: string; className?: string;
}) {
  return (
    <Select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={className}>
      {allLabel ? <option value="">{allLabel}</option> : <option value="" disabled>اختر المجموعة</option>}
      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </Select>
  );
}

// ─── Notifications ───────────────────────────────────────────────────────────
const NOTIF_ICON: Record<string, { i: typeof Bell; c: string }> = {
  absence: { i: TriangleAlert, c: TONE_HEX.danger },
  grade: { i: GraduationCap, c: TONE_HEX.success },
  exam: { i: BookOpen, c: TONE_HEX.warning },
  announcement: { i: Megaphone, c: TONE_HEX.primary },
  note: { i: MessageCircle, c: TONE_HEX.info },
  schedule: { i: CalendarClock, c: TONE_HEX.info },
};

export function NotificationsView() {
  const { run } = useUi();
  const state = useAsync(() => notificationApi.list(), []);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const markAll = async () => {
    await run(() => notificationApi.markAllRead(), "تم تحديد الكل كمقروء");
    state.setData((d) => d?.map((n) => ({ ...n, is_read: true })) ?? d);
  };
  const open = async (n: NotificationRow) => {
    if (n.is_read) return;
    state.setData((d) => d?.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)) ?? d);
    notificationApi.markRead(n.id).catch(() => {});
  };
  const remove = async (n: NotificationRow) => {
    await run(() => notificationApi.remove(n.id));
    state.setData((d) => d?.filter((x) => x.id !== n.id) ?? d);
  };

  const unread = state.data?.filter((n) => !n.is_read).length ?? 0;

  return (
    <>
      <PageHeader title="الإشعارات" icon={Bell} subtitle={unread ? `${unread} إشعار غير مقروء` : "لا توجد إشعارات جديدة"} actions={unread > 0 && <Button variant="secondary" icon={CheckCheck} onClick={markAll}>تحديد الكل كمقروء</Button>} />
      <Tabs value={filter} onChange={setFilter} items={[{ value: "all", label: "الكل", count: state.data?.length }, { value: "unread", label: "غير المقروء", count: unread }]} />
      <Async state={state}>
        {(list) => {
          const shown = filter === "unread" ? list.filter((n) => !n.is_read) : list;
          if (!shown.length) return <EmptyState icon={Bell} message="لا توجد إشعارات" />;
          return (
            <div className="space-y-3">
              {shown.map((n, i) => {
                const k = NOTIF_ICON[n.type] ?? { i: Bell, c: TONE_HEX.primary };
                return (
                  <div key={n.id} onClick={() => open(n)} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
                    className={cx("group flex cursor-pointer gap-4 rounded-3xl border bg-surface p-4 shadow-soft transition animate-in", n.is_read ? "border-line" : "border-primary/40 bg-primary-soft/40")}>
                    <IconBadge icon={k.i} color={k.c} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 font-extrabold">{n.title}</div>
                        {!n.is_read && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      {n.body && <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink/75">{n.body}</p>}
                      <div className="mt-1.5 text-xs text-muted">{Fmt.timeAgo(n.created_at)}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); remove(n); }} className="self-start rounded-xl p-2 text-muted opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100 cursor-pointer" aria-label="حذف">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        }}
      </Async>
    </>
  );
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export function ChatView() {
  const { profile } = useAuth();
  const me = profile!;
  const state = useAsync(() => chatApi.conversations(me.role, me.id), [me.id]);
  const [active, setActive] = useState<ChatContact | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"chats" | "contacts">("chats");

  useEffect(() => {
    const ch = sb().channel(`inbox-${me.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${me.id}` }, () => state.reload())
      .subscribe();
    return () => { sb().removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.id]);

  const list = (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-line p-4">
        <Input icon={Search} placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface-2 p-1">
          {(["chats", "contacts"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cx("rounded-xl py-2 text-sm font-bold cursor-pointer", tab === t ? "bg-brand text-white" : "text-muted")}>
              {t === "chats" ? "المحادثات" : "جهات الاتصال"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <Async state={state}>
          {(d) => {
            const s = q.trim();
            if (tab === "chats") {
              const convs = d.conversations.filter((c) => !s || c.contact.name.includes(s));
              if (!convs.length) return <EmptyState icon={MessageCircle} message={"لا توجد محادثات بعد.\nابدأ محادثة من جهات الاتصال."} />;
              return convs.map((c) => (
                <button key={c.contact.id} onClick={() => setActive(c.contact)} className={cx("flex w-full items-center gap-3 rounded-2xl p-3 text-start transition cursor-pointer", active?.id === c.contact.id ? "bg-primary-soft" : "hover:bg-surface-3")}>
                  <Avatar name={c.contact.name} size={46} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate font-extrabold">{c.contact.name}</span>
                      <span className="text-[11px] text-muted">{Fmt.timeAgo(c.last.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cx("flex-1 truncate text-sm", c.unread ? "font-bold text-ink" : "text-muted")}>{c.last.sender_id === me.id ? "أنت: " : ""}{c.last.body}</span>
                      {c.unread > 0 && <span className="rounded-full bg-primary px-2 text-[11px] font-black text-white">{c.unread}</span>}
                    </div>
                  </div>
                </button>
              ));
            }
            const cs = d.contacts.filter((c) => !s || c.name.includes(s));
            if (!cs.length) return <EmptyState icon={User} message="لا توجد جهات اتصال متاحة" />;
            return cs.map((c) => (
              <button key={c.id} onClick={() => setActive(c)} className={cx("flex w-full items-center gap-3 rounded-2xl p-3 text-start transition cursor-pointer", active?.id === c.id ? "bg-primary-soft" : "hover:bg-surface-3")}>
                <Avatar name={c.name} size={42} />
                <div className="min-w-0">
                  <div className="truncate font-bold">{c.name}</div>
                  <div className="truncate text-xs text-muted">{c.subtitle}</div>
                </div>
              </button>
            ));
          }}
        </Async>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader title="الرسائل" icon={MessageCircle} subtitle="تواصل مباشر وآمن" />
      <div className="grid h-[calc(100vh-13rem)] min-h-[520px] overflow-hidden rounded-[28px] border border-line bg-surface shadow-soft md:grid-cols-[340px_1fr]">
        <div className={cx("border-e border-line", active ? "hidden md:block" : "")}>{list}</div>
        <div className={cx("min-w-0", active ? "" : "hidden md:block")}>
          {active ? <Thread contact={active} onBack={() => setActive(null)} onSent={state.reload} /> : (
            <div className="grid h-full place-items-center"><EmptyState icon={MessageCircle} message="اختر محادثة لعرضها" /></div>
          )}
        </div>
      </div>
    </>
  );
}

function Thread({ contact, onBack, onSent }: { contact: ChatContact; onBack(): void; onSent(): void }) {
  const { profile, settings } = useAuth();
  const me = profile!.id;
  const [msgs, setMsgs] = useState<MessageRow[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useUi();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const load = () => chatApi.thread(me, contact.id).then((m) => { if (alive) setMsgs(m); chatApi.markRead(me, contact.id); }).catch(() => alive && setMsgs([]));
    setMsgs(null);
    load();
    const ch = sb().channel(`thread-${me}-${contact.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${me}` }, (p) => {
        if ((p.new as MessageRow).sender_id === contact.id) load();
      })
      .subscribe();
    return () => { alive = false; sb().removeChannel(ch); };
  }, [me, contact.id]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await chatApi.send(me, contact.id, text, contact.studentId);
      setText("");
      setMsgs(await chatApi.thread(me, contact.id));
      onSent();
    } catch (err) {
      toast(friendlyError(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const wa = whatsappLink(contact.phone, "السلام عليكم", settings?.country_code);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button onClick={onBack} className="grid size-9 place-items-center rounded-xl hover:bg-surface-3 md:hidden cursor-pointer" aria-label="رجوع"><ArrowRight className="size-5" /></button>
        <Avatar name={contact.name} size={42} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-extrabold">{contact.name}</div>
          {contact.subtitle && <div className="truncate text-xs text-muted">{contact.subtitle}</div>}
        </div>
        {wa && <a href={wa} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-xl bg-success/10 text-success" title="واتساب"><Phone className="size-5" /></a>}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto bg-surface-2 p-4">
        {msgs === null ? <div className="grid h-full place-items-center"><Spinner /></div> : msgs.length === 0 ? <EmptyState icon={MessageCircle} message="ابدأ المحادثة بإرسال رسالة" /> : msgs.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={cx("flex", mine ? "justify-start" : "justify-end")}>
              <div className={cx("max-w-[78%] rounded-3xl px-4 py-2.5 shadow-sm", mine ? "rounded-es-md bg-brand text-white" : "rounded-ee-md border border-line bg-surface")}>
                <p className="whitespace-pre-wrap break-words text-[14.5px] leading-6">{m.body}</p>
                <div className={cx("mt-1 text-[10.5px]", mine ? "text-white/70" : "text-muted")}>{Fmt.dateTime(m.created_at)}{mine && m.read_at ? " • مقروءة" : ""}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
          rows={1}
          maxLength={4000}
          placeholder="اكتب رسالتك..."
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-surface-2 px-4 py-2.5 outline-none focus:border-primary"
        />
        <Button type="submit" loading={busy} className="size-11 !px-0" aria-label="إرسال">{!busy && <Send className="size-5 -scale-x-100" />}</Button>
      </form>
    </div>
  );
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export function ProfileView() {
  const { profile, refresh } = useAuth();
  const { run, toast } = useUi();
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState<"info" | "pw" | null>(null);
  if (!profile) return null;

  const saveInfo = async () => {
    if (name.trim().length < 2) return toast("الاسم مطلوب", "error");
    setBusy("info");
    await run(async () => {
      const { error } = await sb().from("user_profiles").update({ name: name.trim(), phone: phone.trim() || null }).eq("id", profile.id);
      if (error) throw error;
      await refresh();
    }, "تم حفظ البيانات");
    setBusy(null);
  };
  const savePw = async () => {
    if (pw.length < 8) return toast("كلمة المرور يجب ألا تقل عن 8 أحرف", "error");
    if (pw !== pw2) return toast("كلمتا المرور غير متطابقتين", "error");
    setBusy("pw");
    await run(async () => {
      const { error } = await sb().auth.updateUser({ password: pw });
      if (error) throw error;
      setPw("");
      setPw2("");
    }, "تم تغيير كلمة المرور");
    setBusy(null);
  };

  return (
    <>
      <div className="relative mb-6 overflow-hidden rounded-[28px] bg-hero p-6 text-white shadow-soft animate-in md:p-8">
        <div className="absolute -top-16 -end-12 size-56 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="rounded-full border-2 border-white/50 p-1"><Avatar name={profile.name} size={84} /></div>
          <div>
            <h1 className="text-3xl font-black">{profile.name}</h1>
            <div className="mt-1 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-white/18 px-3 py-1 font-bold">{ROLE_LABEL[profile.role]}</span>
              <span className="rounded-full bg-white/18 px-3 py-1" dir="ltr">{profile.email}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold"><User className="size-5 text-primary" /> البيانات الشخصية</h2>
          <div className="space-y-4">
            <Field label="الاسم"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="رقم الموبايل"><Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className="text-start" /></Field>
            <Field label="البريد الإلكتروني"><Input value={profile.email ?? ""} disabled dir="ltr" className="text-start" /></Field>
            <Button icon={Save} loading={busy === "info"} onClick={saveInfo}>حفظ</Button>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold"><KeyRound className="size-5 text-primary" /> تغيير كلمة المرور</h2>
          <div className="space-y-4">
            <Field label="كلمة المرور الجديدة"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
            <Field label="تأكيد كلمة المرور"><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></Field>
            <Button icon={KeyRound} loading={busy === "pw"} onClick={savePw}>تحديث كلمة المرور</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
