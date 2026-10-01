/** Turns any Supabase / network error into a short Arabic message (same wording as the app). */
export function friendlyError(error: unknown): string {
  if (!error) return "حدث خطأ غير متوقع، حاول مرة أخرى";
  if (error instanceof AppError) return error.message;

  const e = error as { message?: string; code?: string; status?: number; details?: string; name?: string; context?: unknown };
  const m = (e.message ?? String(error)).toLowerCase();

  // Auth errors
  if (m.includes("invalid login credentials") || m.includes("invalid_credentials"))
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user_already_exists"))
    return "هذا البريد الإلكتروني مسجل بالفعل";
  if (m.includes("email not confirmed")) return "يرجى تأكيد بريدك الإلكتروني أولاً ثم إعادة المحاولة";
  if (m.includes("rate limit") || m.includes("too many") || e.status === 429)
    return "محاولات كثيرة، يرجى الانتظار قليلاً ثم إعادة المحاولة";
  if (m.includes("password") && (m.includes("short") || m.includes("at least") || m.includes("weak")))
    return "كلمة المرور ضعيفة، استخدم 8 أحرف على الأقل";
  if (m.includes("same password") || m.includes("different from the old"))
    return "كلمة المرور الجديدة يجب أن تختلف عن الحالية";
  if (m.includes("banned")) return "هذا الحساب موقوف، تواصل مع الإدارة";

  // Postgres / PostgREST errors
  switch (e.code) {
    case "P0001":
    case "P0002":
    case "22023":
      return e.message ?? "تعذر إتمام العملية";
    case "42501":
      return "غير مصرح لك بتنفيذ هذا الإجراء";
    case "23505": {
      const d = `${e.message} ${e.details ?? ""}`.toLowerCase();
      if (d.includes("student_code")) return "كود الطالب مستخدم من قبل";
      if (d.includes("attendance")) return "تم تسجيل الحضور لهذا الطالب من قبل";
      if (d.includes("email")) return "هذا البريد الإلكتروني مسجل بالفعل";
      return "هذا العنصر موجود بالفعل";
    }
    case "23503":
      return "لا يمكن تنفيذ العملية لارتباط هذا العنصر ببيانات أخرى";
    case "23514":
      return "القيمة المدخلة غير صالحة";
    case "23502":
      return "يوجد حقل مطلوب لم يتم إدخاله";
    case "PGRST116":
      return "العنصر المطلوب غير موجود";
    case "PGRST301":
      return "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى";
  }

  if (m.includes("failed to fetch") || m.includes("network") || m.includes("fetch failed"))
    return "تعذر الاتصال بالخادم، تحقق من الإنترنت";
  return "تعذر إتمام العملية، حاول مرة أخرى";
}

export class AppError extends Error {}
