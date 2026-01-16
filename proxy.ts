import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/trips(.*)",
  "/points(.*)",
  "/profile(.*)",
  "/refer(.*)",
  "/notifications(.*)",
  "/search(.*)",
]);

// Define public auth routes (login, signup, sign-in, sign-up, etc.)
const isPublicAuthRoute = createRouteMatcher([
  "/login(.*)",
  "/signup(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forgot-password(.*)",
  "/reset-password(.*)",
  "/auth(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Protect routes that require authentication
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from auth pages
  // BUT: Don't redirect from /sign-in if they're going to /dashboard after sign-in
  // This prevents redirect loops
  if (isPublicAuthRoute(req) && userId) {
    // If user is already signed in and on sign-in page, let Clerk handle the redirect
    // Don't force a redirect here as it can cause loops
    if (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up')) {
      // Clerk will handle redirecting signed-in users
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
