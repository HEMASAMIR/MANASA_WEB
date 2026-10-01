"use client";

import { useState, type ReactNode } from "react";
import { useLang } from "@/lib/i18n";
import { EN_SUBJECT_OVERRIDES } from "@/lib/i18n-en-edu";
import {
  SYSTEMS, STAGES, findSubject, parseStage, parseStudentGrade, studentGradeText, subjectTracks,
  type Stage, type SubjectDef, type SystemId, type TrackRef,
} from "@/lib/curriculum";
import { Input, cx } from "./ui";

/** Subject names whose English differs from the shared dictionary ("التاريخ" is "Date" elsewhere). */
export function useSubjectName() {
  const { lang } = useLang();
  return (s: string) => (lang === "en" && EN_SUBJECT_OVERRIDES[s]) || s;
}

export function SubjectName({ n }: { n: string }) {
  return <>{useSubjectName()(n)}</>;
}

function Chip({ on, color = "#0e2c4e", onClick, children, className }: { on: boolean; color?: string; onClick(): void; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={cx("inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer", on ? "text-white shadow-md" : "border-line bg-surface text-ink/80 hover:border-primary/50", className)}
      style={on ? { background: color, borderColor: color } : undefined}>
      {children}
    </button>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-[13px] font-bold text-ink/80">{children}</div>;
}

// ─── Stage ───────────────────────────────────────────────────────────────────

/** System → year chips, with a free-text fallback. Works on the stored grade text. */
export function StagePicker({ value, onChange, label = "الصف الدراسي" }: { value: string; onChange(v: string): void; label?: string }) {
  const stage = parseStage(value);
  const [mode, setMode] = useState<SystemId | "other">(stage?.system ?? (value.trim() ? "other" : "bac"));
  const years = STAGES.filter((s) => s.system === mode);
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {SYSTEMS.map((s) => (
          <Chip key={s.id} on={mode === s.id} color={s.color} onClick={() => { setMode(s.id); if (stage?.system !== s.id) onChange(""); }}>
            <span>{s.emoji}</span> {s.name}
          </Chip>
        ))}
        <Chip on={mode === "other"} color="#64748b" onClick={() => { setMode("other"); if (stage) onChange(""); }}>صف آخر</Chip>
      </div>
      {mode === "other" ? (
        <Input className="mt-2" value={value} onChange={(e) => onChange(e.target.value)} placeholder="مثال: الصف الثالث الإعدادي" />
      ) : (
        <div className="mt-2 flex flex-wrap gap-2 rounded-2xl bg-surface-2 p-2">
          {years.map((s) => (
            <Chip key={s.id} on={stage?.id === s.id} color={SYSTEMS.find((x) => x.id === s.system)!.color} onClick={() => onChange(s.label)}>
              {s.label.split(" — ")[0]}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Subject ─────────────────────────────────────────────────────────────────

/** Subject chips for a stage, grouped by track. Falls back to free text. */
export function SubjectPicker({ stage, value, onChange }: { stage: Stage | null; value: string; onChange(v: string): void }) {
  const sn = useSubjectName();
  const known = findSubject(stage, value);
  const [custom, setCustom] = useState(!!value && !known);
  if (!stage) {
    return (
      <div>
        <Label>المادة</Label>
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  const shared = stage.subjects.filter((s) => s.tracks === "all");
  const groups = stage.tracks.map((t) => ({ t, subjects: stage.subjects.filter((s) => s.tracks !== "all" && s.tracks.includes(t.id)) })).filter((g) => g.subjects.length);
  const pick = (s: SubjectDef) => { setCustom(false); onChange(s.name); };
  const chip = (s: SubjectDef, color: string) => (
    <Chip key={s.name} on={!custom && value === s.name} color={color} onClick={() => pick(s)}>
      <span>{s.emoji}</span> {sn(s.name)}
    </Chip>
  );
  return (
    <div>
      <Label>المادة</Label>
      <div className="space-y-3 rounded-2xl border border-line bg-surface-2 p-3">
        {shared.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-black text-muted">{stage.tracks.length ? "مواد أساسية لكل المسارات" : "مواد الصف"}</div>
            <div className="flex flex-wrap gap-2">{shared.map((s) => chip(s, "#0e2c4e"))}</div>
          </div>
        )}
        {groups.map(({ t, subjects }) => (
          <div key={t.id}>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black" style={{ color: t.color }}>
              <span>{t.emoji}</span> {t.name}
              {subjects.some((s) => s.kind === "choice") && <span className="font-bold text-muted">— الطالب يختار مادة واحدة</span>}
            </div>
            <div className="flex flex-wrap gap-2">{subjects.map((s) => chip(s, t.color))}</div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <Chip on={custom} color="#64748b" onClick={() => { setCustom(true); if (known) onChange(""); }}>مادة أخرى</Chip>
          {custom && <Input className="max-w-xs" value={value} onChange={(e) => onChange(e.target.value)} placeholder="اسم المادة" />}
        </div>
      </div>
    </div>
  );
}

// ─── Student grade (stage + track) ───────────────────────────────────────────

export function StudentGradePicker({ value, onChange }: { value: string; onChange(v: string): void }) {
  const { stage, track } = parseStudentGrade(value);
  return (
    <div className="space-y-3">
      <StagePicker value={stage ? stage.label : value} onChange={(v) => { const s = parseStage(v); onChange(s ? studentGradeText(s, null) : v); }} />
      {stage && stage.tracks.length > 0 && (
        <div>
          <Label>{stage.system === "bac" ? "المسار" : "الشعبة"}</Label>
          <div className="flex flex-wrap gap-2">
            {stage.tracks.map((t) => (
              <Chip key={t.id} on={track?.id === t.id} color={t.color} onClick={() => onChange(studentGradeText(stage, t))}>
                <span>{t.emoji}</span> {t.name}
              </Chip>
            ))}
          </div>
          {!track && <p className="mt-1.5 text-xs text-muted">اختياري — يساعد الطالب يشوف المواد الخاصة بمساره</p>}
        </div>
      )}
    </div>
  );
}

// ─── Badges ──────────────────────────────────────────────────────────────────

/** Stage + track chips for a class or course. */
export function CurriculumBadges({ grade, subject, size = "sm" }: { grade: string | null | undefined; subject?: string | null; size?: "sm" | "xs" }) {
  const stage = parseStage(grade);
  if (!stage) return grade ? <Tag color="#64748b" size={size}>{grade}</Tag> : null;
  const sys = SYSTEMS.find((s) => s.id === stage.system)!;
  const tracks = subjectTracks(stage, subject);
  return (
    <>
      <Tag color={sys.color} size={size}>{stage.short}</Tag>
      {tracks.map((t) => <Tag key={t.id} color={t.color} size={size}>{t.emoji} {t.name}</Tag>)}
    </>
  );
}

export function StudentBadges({ grade }: { grade: string | null | undefined }) {
  const { stage, track } = parseStudentGrade(grade);
  if (!stage) return grade ? <Tag color="#64748b">{grade}</Tag> : null;
  const sys = SYSTEMS.find((s) => s.id === stage.system)!;
  return (
    <>
      <Tag color={sys.color}>{stage.short}</Tag>
      {track && <Tag color={track.color}>{track.emoji} {track.name}</Tag>}
    </>
  );
}

function Tag({ color, children, size = "sm" }: { color: string; children: ReactNode; size?: "sm" | "xs" }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full font-extrabold whitespace-nowrap", size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11.5px]")}
      style={{ color, background: `${color}1a`, border: `1px solid ${color}40` }}>
      {children}
    </span>
  );
}

export type { TrackRef };
