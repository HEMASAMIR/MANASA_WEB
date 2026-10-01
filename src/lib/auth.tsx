"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { initBackend, sb } from "./supabase";
import { AppError } from "./errors";
import { peopleApi, settingsApi } from "./api";
import type { AppSettings, Assistant, Profile, Role } from "./types";

const CLAIM_CODE = "claim_student_code";
const CLAIM_PHONE = "claim_parent_phone";

interface AuthState {
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  settings: AppSettings | null;
  assistant: Assistant | null;
  claimWarning: string | null;
  login(email: string, password: string): Promise<Profile>;
  register(input: RegisterInput): Promise<{ needsConfirmation: boolean; profile?: Profile }>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  clearClaimWarning(): void;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: "parent" | "student";
  phone: string;
  studentCode: string;
  parentPhone: string;
}

const Ctx = createContext<AuthState | null>(null);

async function loadProfile(user: User): Promise<Profile> {
  const { data, error } = await sb().from("user_profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (!data) {
    await sb().auth.signOut();
    throw new AppError("لم يتم العثور على بيانات الحساب، تواصل مع الإدارة");
  }
  if (data.status !== "active") {
    await sb().auth.signOut();
    throw new AppError("هذا الحساب موقوف، تواصل مع الإدارة");
  }
  return data as Profile;
}

/** Finishes a "link my child / me" request typed during sign-up (same as the app). */
async function completePendingClaim(user: User, profile: Profile): Promise<string | null> {
  if (profile.role !== "parent" && profile.role !== "student") return null;
  const meta = user.user_metadata ?? {};
  const code = String(meta[CLAIM_CODE] ?? "").trim();
  const phone = String(meta[CLAIM_PHONE] ?? "").trim();
  if (!code) return null;
  let warning: string | null = null;
  const { error } = await sb().rpc("claim_student", { p_student_code: code, p_phone: phone });
  if (error) {
    if (!["P0001", "P0002", "22023"].includes(error.code ?? "")) return null; // transient: retry next login
    warning = error.message;
  }
  await sb().auth.updateUser({ data: { [CLAIM_CODE]: "", [CLAIM_PHONE]: "" } });
  return warning;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [claimWarning, setClaimWarning] = useState<string | null>(null);

  const hydrate = useCallback(async (u: User | null) => {
    if (!u) {
      setUser(null);
      setProfile(null);
      setAssistant(null);
      return null;
    }
    const p = await loadProfile(u);
    const [s, a, w] = await Promise.all([
      settingsApi.load().catch(() => null),
      p.role === "assistant" ? peopleApi.myAssistant(u.id).catch(() => null) : Promise.resolve(null),
      completePendingClaim(u, p).catch(() => null),
    ]);
    setUser(u);
    setProfile(p);
    setSettings(s);
    setAssistant(a);
    if (w) setClaimWarning(w);
    return p;
  }, []);

  useEffect(() => {
    let alive = true;
    let unsub: (() => void) | null = null;
    initBackend().then(async () => {
      const { data } = await sb().auth.getSession();
      try {
        await hydrate(data.session?.user ?? null);
      } catch {
        setUser(null);
        setProfile(null);
      } finally {
        if (alive) setLoading(false);
      }
      const { data: sub } = sb().auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setAssistant(null);
        }
      });
      unsub = () => sub.subscription.unsubscribe();
    });
    return () => {
      alive = false;
      unsub?.();
    };
  }, [hydrate]);

  const value = useMemo<AuthState>(() => ({
    loading, user, profile, settings, assistant, claimWarning,
    async login(email, password) {
      const { data, error } = await sb().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      const p = await hydrate(data.user);
      return p!;
    },
    async register(i) {
      const { data, error } = await sb().auth.signUp({
        email: i.email.trim(),
        password: i.password,
        options: {
          data: {
            name: i.name.trim(), phone: i.phone.trim(), role: i.role,
            [CLAIM_CODE]: i.studentCode.trim(),
            [CLAIM_PHONE]: i.role === "parent" ? i.phone.trim() : i.parentPhone.trim(),
          },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
        },
      });
      if (error) throw error;
      if (!data.user) throw new AppError("تعذر إنشاء الحساب");
      if (data.user.identities && data.user.identities.length === 0) throw new AppError("هذا البريد الإلكتروني مسجل بالفعل");
      if (!data.session) return { needsConfirmation: true };
      const p = await hydrate(data.user);
      return { needsConfirmation: false, profile: p! };
    },
    async logout() {
      await sb().auth.signOut();
      setUser(null);
      setProfile(null);
      setAssistant(null);
    },
    async refresh() {
      const { data } = await sb().auth.getUser();
      await hydrate(data.user);
    },
    clearClaimWarning: () => setClaimWarning(null),
  }), [loading, user, profile, settings, assistant, claimWarning, hydrate]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}

/** What a staff member may do (the database enforces the same rules). */
export function useStaffPerms() {
  const { profile, assistant } = useAuth();
  const role: Role | undefined = profile?.role;
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isAssistant = role === "assistant";
  return {
    isAdmin, isTeacher, isAssistant,
    canTakeAttendance: !isAssistant || !!assistant?.can_scan_attendance,
    canGrade: !isAssistant || !!assistant?.can_enter_grades,
    canContactParents: !isAssistant || !!assistant?.can_contact_parents,
    canSeeFinance: !isAssistant || !!assistant?.can_view_financials,
    canManage: isAdmin || isTeacher,
  };
}
