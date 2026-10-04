import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { langInitScript, themeInitScript } from "@/lib/init-scripts";
import { UiProvider } from "@/components/ui";
import { LangProvider } from "@/lib/i18n";
import { Motion } from "@/components/motion";
import { PreferenceToast } from "@/components/pref-toast";
import { SITE_URL } from "@/lib/site";

const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800", "900"] });

const appName = process.env.NEXT_PUBLIC_APP_NAME || "منارة";

const description = "منصة متكاملة لإدارة السناتر والمدارس: كورسات البكالوريا المصرية والثانوية العامة، حضور بالـ QR، كويزات تفاعلية، درجات، مالية، ومتابعة لحظية لأولياء الأمور.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${appName} | منصة إدارة التعليم والمتابعة الذكية`, template: `%s | ${appName}` },
  description,
  icons: { icon: "/logo.svg", apple: "/logo.png" },
  // Preview card when the link is shared on WhatsApp, Facebook, etc.
  openGraph: {
    type: "website",
    locale: "ar_EG",
    siteName: appName,
    title: `${appName} | منصة إدارة التعليم والمتابعة الذكية`,
    description,
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: appName }],
  },
  twitter: { card: "summary", title: appName, description, images: ["/logo.png"] },
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
              <UiProvider>
                {children}
                <Motion />
                <PreferenceToast />
              </UiProvider>
            </AuthProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
