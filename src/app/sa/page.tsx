import type { Metadata } from "next";
import { SaudiView } from "./view";

export const metadata: Metadata = {
  title: "منصة المراكز التعليمية في السعودية",
  description: "منصة متكاملة لمراكز التدريب والمدارس في السعودية: نظام المسارات، القدرات والتحصيلي، الحضور بالـ QR، الكويزات، المالية بالريال، ومتابعة لحظية لأولياء الأمور.",
  openGraph: { locale: "ar_SA" },
};

export default function SaudiPage() {
  return <SaudiView />;
}
