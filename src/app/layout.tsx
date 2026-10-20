import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pathforge",
  description: "Build a clear path from curiosity to capability.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
          {children}
        </main>
        <footer className="border-t border-black/10 px-6 py-5 text-sm text-black/60">
          <div className="mx-auto max-w-5xl">Pathforge</div>
        </footer>
      </body>
    </html>
  );
}
