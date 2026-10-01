import type { Metadata } from "next";
import { BaccalaureateView } from "./view";

export const metadata: Metadata = {
  title: "البكالوريا المصرية والثانوية العامة",
  description: "دليلك الكامل لنظام البكالوريا المصرية والثانوية العامة: المسارات الأربعة، المواد من أولى لتالتة ثانوي، توزيع الدرجات، فرص الامتحان، وحاسبة المجموع.",
};

export default function BaccalaureatePage() {
  return <BaccalaureateView />;
}
