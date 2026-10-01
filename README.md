# منارة — نسخة الويب

موقع Next.js للمنصة كاملة (الإدارة/المدرسين/المساعدين، الطالب، ولي الأمر) يعمل على **نفس قاعدة بيانات Supabase** الخاصة بتطبيق الموبايل `attendance_pro` — نفس الحسابات ونفس البيانات ونفس الصلاحيات (Row Level Security).

## التشغيل

```bash
npm install
cp .env.example .env.local   # ثم ضع رابط ومفتاح مشروع Supabase
npm run dev                  # http://localhost:3000
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   (Project Settings → API)
NEXT_PUBLIC_APP_NAME=اسم السنتر
```

> المفتاح العام (anon / publishable) آمن في المتصفح لأن كل الصلاحيات محمية داخل قاعدة البيانات. **لا تضع مفتاح service role أبداً.**

## إعداد Supabase للموقع

نفس خطوات `attendance_pro/supabase/README.md` (schema.sql + دالة manage-user)، بالإضافة إلى:

- **Authentication → URL Configuration**: ضع رابط الموقع في *Site URL* وأضف
  `https://your-domain/reset-password` و `https://your-domain/login` إلى *Redirect URLs*
  (لروابط استعادة كلمة المرور وتأكيد البريد).

## النشر (Vercel)

1. ارفع المشروع على GitHub ثم Import في Vercel.
2. أضف متغيرات البيئة الثلاثة أعلاه.
3. Deploy.

## الصفحات

| البوابة | المسار | المحتوى |
|---|---|---|
| عامة | `/` `/login` `/register` `/forgot-password` `/reset-password` | الصفحة الرئيسية وتسجيل الدخول وإنشاء حساب ولي أمر/طالب |
| الإدارة | `/admin/...` | نظرة عامة، الحضور + QR متغير، الطلاب (إضافة/استيراد Excel/تصدير)، المجموعات والجدول، الامتحانات والدرجات، الكويزات التفاعلية، الكورسات والدروس، المالية، الرسائل، لوحة الشرف، إشعار جماعي، التقارير، المدرسون والمساعدون، مراقبة المحادثات، إعدادات المركز، سجل العمليات |
| الطالب | `/student/...` | الرئيسية، حضوري + مسح QR بالكاميرا، كورساتي ومشغل الدروس، حل الكويزات، الامتحانات، الدرجات، الجدول، الرسائل، الإشعارات |
| ولي الأمر | `/parent/...` | متابعة الأبناء (حضور، درجات، اشتراك ومدفوعات)، ربط طالب، الرسائل، الإشعارات |

ما يظهر لكل مستخدم يتحدد بدوره وصلاحياته (نفس منطق `StaffSession` في التطبيق)، وقاعدة البيانات تفرض نفس القواعد.
