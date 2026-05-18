import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/Toaster";
import TopNav from "@/components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Watify",
  description: "Single-user WhatsApp notification service",
};

// TKT-0044 iter A: inline theme-set script runs before React hydrates,
// so the dark class is on <html> from the first paint -- no flash of
// light theme. Reads localStorage `watify.theme` (TKT-0043) and falls
// back to the OS preference.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('watify.theme');if(t!=='light'&&t!=='dark'&&t!=='system')t='system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <TopNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
