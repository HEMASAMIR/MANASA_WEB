/**
 * Plans shown on the Saudi landing page (/sa). Prices are monthly, in SAR, before VAT.
 * These are starting suggestions: change them here and the page updates everywhere.
 */
export interface Plan {
  id: string;
  name: string;
  students: string;
  monthly: number;
  popular?: boolean;
  features: string[];
}

export const CURRENCY_SA = "ر.س";
/** Months charged when paying yearly (12 months for the price of 10). */
export const YEARLY_MONTHS = 10;

export const PLANS_SA: Plan[] = [
  {
    id: "starter",
    name: "الأساسية",
    students: "حتى 150 طالب",
    monthly: 349,
    features: ["الحضور بالـ QR وإشعارات ولي الأمر", "الكورسات والدروس المسجلة", "الكويزات والدرجات", "دعم فني عبر واتساب"],
  },
  {
    id: "growth",
    name: "النمو",
    students: "حتى 500 طالب",
    monthly: 799,
    popular: true,
    features: ["كل مميزات الباقة الأساسية", "المالية والاشتراكات بالريال", "التقارير والتحليلات وتصدير Excel", "صلاحيات للمدرسين والمساعدين", "إعداد ونقل بيانات مجاني"],
  },
  {
    id: "pro",
    name: "المؤسسات",
    students: "عدد طلاب غير محدود",
    monthly: 1499,
    features: ["كل مميزات باقة النمو", "استيراد الطلاب من ملفات Excel", "شعار واسم مركزك على المنصة", "مدير حساب مخصص", "تدريب فريقك عن بُعد"],
  },
];
