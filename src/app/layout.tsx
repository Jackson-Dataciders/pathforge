import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { ColorThemeProvider } from "@/theme/color-theme";
import { NoFlashScript } from "@/theme/no-flash-script";
import { ThemeProvider } from "@/theme/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pathforge",
  description: "Build a clear path from curiosity to capability.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <NoFlashScript />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <ThemeProvider>
          <ColorThemeProvider>
            <SiteHeader />
            <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
              {children}
            </main>
            <footer className="border-t border-border px-6 py-5 text-sm text-muted">
              <div className="mx-auto max-w-5xl">Pathforge</div>
            </footer>
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
