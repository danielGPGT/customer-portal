import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { ErrorSuppression } from "@/components/error-suppression";
import { ErrorBoundary } from "@/app/error-boundary";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Grand Prix Grand Tours Portal",
  description: "View and manage your loyalty points, trips, and referrals",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={outfit.variable}>
        <body
          className="font-sans antialiased overflow-x-hidden"
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <ErrorBoundary>
              <ErrorSuppression />
              {children}
              <Toaster />
            </ErrorBoundary>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
