"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import { usePortal, studentPortalApi, type PortalLesson } from "@/lib/student";
import { Fmt } from "@/lib/fmt";
import { Button, Card, EmptyState, Progress, cx, useUi } from "@/components/ui";

/** Turns YouTube / Vimeo links into an embeddable URL; other links play in <video>. */
function embed(url: string): { kind: "iframe" | "video"; src: string } {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };
  const gd = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gd) return { kind: "iframe", src: `https://drive.google.com/file/d/${gd[1]}/preview` };
  return { kind: "video", src: url };
}

export default function CoursePlayer() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, reload } = usePortal();
  const { run } = useUi();
  const course = data.courses.find((c) => c.id === id);
  const firstOpen = useMemo(() => course?.lessons.find((l) => !l.completed && !l.is_locked) ?? course?.lessons.find((l) => !l.is_locked), [course]);
  const [current, setCurrent] = useState<PortalLesson | undefined>(firstOpen);
  const [busy, setBusy] = useState(false);

  if (!course) return <EmptyState message="الكورس غير متاح" action={<Button onClick={() => router.push("/student/courses")}>كورساتي</Button>} />;
  const pct = course.lessons.length ? (course.done / course.lessons.length) * 100 : 0;
  const lesson = current ? course.lessons.find((l) => l.id === current.id) ?? current : undefined;
  const media = lesson?.video_url ? embed(lesson.video_url) : null;

  const toggleDone = async () => {
    if (!lesson) return;
    setBusy(true);
    await run(() => studentPortalApi.saveProgress(data.student.id, lesson.id, !lesson.completed), lesson.completed ? undefined : "أحسنت! تم إكمال الدرس ✅");
    await reload();
    setBusy(false);
    if (!lesson.completed) {
      const idx = course.lessons.findIndex((l) => l.id === lesson.id);
      const next = course.lessons.slice(idx + 1).find((l) => !l.is_locked);
      if (next) setCurrent(next);
    }
  };

  return (
    <>
      <button onClick={() => router.push("/student/courses")} className="mb-4 flex items-center gap-1.5 text-sm font-bold text-muted hover:text-primary cursor-pointer"><ArrowRight className="size-4" /> كورساتي</button>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="grid size-16 place-items-center rounded-3xl text-4xl text-white shadow-lg" style={{ background: course.color }}>{course.icon}</div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black md:text-3xl">{course.title}</h1>
          <div className="text-sm text-muted">{course.teacher} • {course.done}/{course.lessons.length} درس</div>
        </div>
        <div className="w-full sm:w-60"><Progress value={pct} color={course.color} /><div className="mt-1 text-end text-xs font-bold" style={{ color: course.color }}>{Math.round(pct)}%</div></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div>
          <div className="overflow-hidden rounded-[28px] bg-black shadow-soft">
            {media ? (
              media.kind === "iframe"
                ? <iframe key={media.src} src={media.src} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen title={lesson?.title} />
                : <video key={media.src} src={media.src} controls controlsList="nodownload" className="aspect-video w-full" onContextMenu={(e) => e.preventDefault()} />
            ) : (
              <div className="grid aspect-video place-items-center text-white/70"><div className="text-center"><PlayCircle className="mx-auto size-16" /><p className="mt-2">{lesson ? "لا يوجد فيديو لهذا الدرس" : "اختر درساً"}</p></div></div>
            )}
          </div>
          {lesson && (
            <Card className="mt-4 flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black">{lesson.title}</h2>
                <div className="text-sm text-muted">{lesson.duration_seconds ? `المدة ${Fmt.duration(lesson.duration_seconds)}` : ""}</div>
              </div>
              <Button variant={lesson.completed ? "outline" : "success"} icon={CheckCircle2} loading={busy} onClick={toggleDone}>{lesson.completed ? "تم الإكمال ✓" : "تحديد كمكتمل"}</Button>
            </Card>
          )}
          {course.description && <Card className="mt-4"><h3 className="mb-2 font-extrabold">عن الكورس</h3><p className="whitespace-pre-line leading-7 text-ink/80">{course.description}</p></Card>}
        </div>

        <Card padded={false} className="h-fit overflow-hidden">
          <div className="border-b border-line px-5 py-4 font-extrabold">محتوى الكورس ({course.lessons.length})</div>
          <div className="max-h-[600px] overflow-y-auto p-2">
            {course.lessons.length === 0 ? <EmptyState icon={PlayCircle} message="لا توجد دروس بعد" /> : course.lessons.map((l, i) => {
              const on = l.id === lesson?.id;
              return (
                <button key={l.id} disabled={l.is_locked} onClick={() => setCurrent(l)}
                  className={cx("flex w-full items-center gap-3 rounded-2xl p-3 text-start transition", on ? "bg-primary-soft" : "hover:bg-surface-3", l.is_locked ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl text-sm font-black" style={on ? { background: course.color, color: "#fff" } : { background: "var(--surface-3)" }}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className={cx("truncate text-sm", on ? "font-extrabold" : "font-semibold")}>{l.title}</div>
                    <div className="text-xs text-muted">{l.duration_seconds ? Fmt.duration(l.duration_seconds) : ""}{!l.completed && l.lastPos > 0 ? ` • توقفت عند ${Fmt.duration(l.lastPos)}` : ""}</div>
                  </div>
                  {l.is_locked ? <Lock className="size-4 text-muted" /> : l.completed ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5 text-line" />}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
