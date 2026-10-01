import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider, themeInitScript } from "@/lib/theme";
import { UiProvider } from "@/components/ui";

const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800", "900"] });

const appName = process.env.NEXT_PUBLIC_APP_NAME || "منارة";

export const metadata: Metadata = {
  title: { default: `${appName} | منصة إدارة التعليم والمتابعة الذكية`, template: `%s | ${appName}` },
  description: "منصة متكاملة لإدارة السناتر والمدارس: حضور بالـ QR، درجات، كويزات تفاعلية، كورسات، مالية، ومتابعة أولياء الأمور.",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d1a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <AuthProvider>
            <UiProvider>{children}</UiProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
