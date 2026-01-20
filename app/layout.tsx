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
    <ClerkProvider
      // Performance optimizations
      appearance={{
        // Reduce initial bundle size by using minimal styling
        elements: {
          rootBox: "w-full",
        },
      }}
      // Enable lazy loading for Clerk components
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en" suppressHydrationWarning className={outfit.variable}>
        <head>
          {/* Preconnect to Clerk domains for faster auth */}
          <link rel="preconnect" href="https://clerk.com" />
          <link rel="preconnect" href="https://clerk.accounts.dev" />
          <link rel="dns-prefetch" href="https://clerk.com" />
          <link rel="dns-prefetch" href="https://clerk.accounts.dev" />
        </head>
        <body
          className="font-sans antialiased overflow-x-hidden"
          suppressHydrationWarning
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
