"use client";

import Link from "next/link";
import { ArrowLeft, Compass, PlayCircle, Sparkles, Target } from "lucide-react";
import { useAsync } from "@/lib/hooks";
import { loadCatalog } from "@/lib/catalog";
import { findSubject, parseStage, parseStudentGrade, planFor, type SubjectDef } from "@/lib/curriculum";
import type { PortalCourse } from "@/lib/student";
import { BrandStripe } from "./site";
import { SubjectName } from "./curriculum";
import { cx } from "./ui";

/** Every subject of the student's stage/track, with what they study now and what the center offers. */
export function StudyPlan({ grade, courses }: { grade: string; courses: PortalCourse[] }) {
  const { stage, track } = parseStudentGrade(grade);
  const catalog = useAsync(() => loadCatalog(), []);

  if (!stage) {
    return (
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-[28px] border border-dashed border-primary/40 bg-primary-soft p-5">
        <span className="grid size-12 place-items-center rounded-2xl bg-surface text-primary"><Compass className="size-6" /></span>
        <div className="min-w-0 flex-1">
          <div className="font-black">حدد صفك ومسارك علشان نرتب لك خطة مذاكرتك</div>
          <p className="text-sm text-muted">كلّم إدارة المركز تسجل صفك (بكالوريا أو ثانوية عامة) ومسارك، وهتظهر لك هنا كل مواد مسارك.</p>
        </div>
        <Link href="/baccalaureate" className="rounded-2xl bg-brand px-4 py-2.5 text-sm font-black text-white">دليل البكالوريا</Link>
      </div>
    );
  }

  const plan = planFor(stage, track);
  const mine = (def: SubjectDef) => courses.filter((c) => parseStage(c.grade)?.id === stage.id && findSubject(stage, c.subject)?.name === def.name);
  const offered = (def: SubjectDef) => (catalog.data?.courses ?? []).find((c) => parseStage(c.grade)?.id === stage.id && findSubject(stage, c.subject)?.name === def.name);
  const studiedChoice = plan.choice.find((d) => mine(d).length);
  const choice = studiedChoice ? [studiedChoice] : plan.choice;
  const all = [...plan.core, ...choice, ...plan.track];
  const studying = all.filter((d) => mine(d).length).length;
  const needed = plan.core.length + (plan.choice.length ? 1 : 0) + plan.track.length;

  return (
    <section className="relative mb-7 overflow-hidden rounded-[28px] bg-hero p-5 text-white shadow-soft sm:p-7 animate-in">
      <BrandStripe className="absolute inset-x-0 top-0 h-1.5" />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-gold grid size-12 place-items-center rounded-2xl text-navy shadow-lg"><Target className="size-6" /></span>
            <div>
              <h2 className="text-xl font-black">خطة مذاكرتك</h2>
              <div className="mt-1 flex flex-wrap gap-1.5 text-xs font-bold">
                <span className="rounded-full bg-white/15 px-2.5 py-0.5">{stage.label}</span>
                {track && <span className="rounded-full px-2.5 py-0.5" style={{ background: `${track.color}55` }}>{track.emoji} {track.name}</span>}
              </div>
            </div>
          </div>
          <div className="text-end">
            <div className="text-3xl font-black" dir="ltr">{studying}/{needed}</div>
            <div className="text-xs font-bold text-white/70">مواد بتذاكرها على المنصة</div>
          </div>
        </div>

        {!track && stage.tracks.length > 0 && (
          <p className="mt-4 rounded-2xl bg-amber-400/15 px-4 py-2.5 text-xs font-bold text-amber-200">
            لسه مسارك مش متحدد — كلّم إدارة المركز تحدده علشان تظهر لك مواد التخصص.
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {all.map((d) => (
            <PlanTile key={d.name} def={d} mine={mine(d)} offered={offered(d)?.id ?? null} choice={!studiedChoice && plan.choice.includes(d)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanTile({ def, mine, offered, choice }: { def: SubjectDef; mine: PortalCourse[]; offered: string | null; choice: boolean }) {
  const c = mine[0];
  const pct = c && c.lessons.length ? Math.round((c.done / c.lessons.length) * 100) : 0;
  return (
    <div className={cx("rounded-2xl border p-4 transition", c ? "border-white/15 bg-white/[0.09]" : "border-white/10 bg-white/[0.04]")}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl text-2xl" style={{ background: `${def.color}40` }}>{def.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-black"><SubjectName n={def.name} /></div>
          {choice && <div className="text-[11px] font-bold text-amber-300">مادة تخصص — اختر واحدة</div>}
          {c ? (
            <>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-amber-300" style={{ width: `${pct}%` }} /></div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold text-white/75">
                <span>{c.done} من {c.lessons.length} درس</span>
                <Link href={`/student/courses/${c.id}`} className="flex items-center gap-1 text-amber-300 hover:text-amber-200"><PlayCircle className="size-3.5" /> كمّل مذاكرة</Link>
              </div>
            </>
          ) : offered ? (
            <Link href={`/courses/${offered}`} className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-navy">
              <Sparkles className="size-3.5" /> متاح في المركز — اشترك <ArrowLeft className="size-3.5" />
            </Link>
          ) : (
            <div className="mt-2 text-[11px] font-bold text-white/50">قريباً على المنصة</div>
          )}
        </div>
      </div>
    </div>
  );
}
