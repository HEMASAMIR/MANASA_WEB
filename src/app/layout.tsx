import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { langInitScript, themeInitScript } from "@/lib/init-scripts";
import { UiProvider } from "@/components/ui";
import { LangProvider } from "@/lib/i18n";

const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800", "900"] });

const appName = process.env.NEXT_PUBLIC_APP_NAME || "منارة";

export const metadata: Metadata = {
  title: { default: `${appName} | منصة إدارة التعليم والمتابعة الذكية`, template: `%s | ${appName}` },
  description: "منصة متكاملة لإدارة السناتر والمدارس: حضور بالـ QR، درجات، كويزات تفاعلية، كورسات، مالية، ومتابعة أولياء الأمور.",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#0e2c4e",
  colorScheme: "only light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`} suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" />
        <script dangerouslySetInnerHTML={{ __html: langInitScript + themeInitScript }} />
      </head>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <LangProvider>
            <AuthProvider>
              <UiProvider>{children}</UiProvider>
            </AuthProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
