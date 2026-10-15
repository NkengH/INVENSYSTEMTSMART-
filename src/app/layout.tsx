import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "INVENSMART AI - Smart Inventory Management System",
  description: "Smart Inventory, Better Decisions. AI-Powered Inventory & POS Management System.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Suppress rogue third-party Chrome extension errors from triggering the dev overlay */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(event) {
                  if (
                    (event.filename && event.filename.includes('chrome-extension://')) ||
                    (event.message && (
                      event.message.includes('chrome: call method') ||
                      event.message.includes('chrome-extension')
                    ))
                  ) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return true;
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(event) {
                  var reason = event.reason;
                  var msg = reason && (reason.message || String(reason));
                  var stack = reason && reason.stack;
                  if (
                    (msg && (msg.includes('chrome: call method') || msg.includes('chrome-extension'))) ||
                    (stack && stack.includes('chrome-extension://'))
                  ) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                  }
                }, true);
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
