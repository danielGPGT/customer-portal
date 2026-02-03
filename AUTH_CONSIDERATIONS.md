# Auth considerations (Clerk + customer portal)

Quick reference for what’s in place and what to watch.

## In place

- **Proxy (middleware)** – Next.js 16 uses `proxy.ts` (not `middleware.ts`). It runs Clerk’s `clerkMiddleware()` and protects `/`, `/dashboard`, `/trips`, `/points`, `/profile`, `/refer`, `/notifications`, `/search`, `/support`. Unauthenticated users are redirected to `/sign-in?redirect_url=<requested URL>`.
- **Post-login redirect** – Login and verification flows use `redirect_url` from the query when present and safe (same-origin path), so users return to the page they tried to open.
- **Layout guard** – `(protected)/layout.tsx` uses `auth()` and `getClient()`, redirects on missing/invalid user or no client portal access.
- **Error handling** – Signup/login/forgot-password use soft toasts and `getSignupErrorMessage()`; no raw “Error is unknown” or big red boxes. Compromised passwords (HaveIBeenPwned) show a clear message.
- **ClerkProvider** – Root layout wraps the app with `<ClerkProvider>`; preconnect to Clerk domains is set.

## Gaps addressed

- **Login error params** – Login page now shows soft alerts for `no_email`, `setup_failed`, and `oauth_failed` (from SSO callback), so users see a clear reason when redirected with an error.
- **Dashboard access error** – `client_access_required` uses soft variant and friendlier copy.

## Things to consider

1. **Session expiry** – Clerk handles expiry; optional: custom “session expired” message or redirect to sign-in with `redirect_url`.
2. **Sign out everywhere** – If you need “sign out of all devices”, use Clerk’s session management or dashboard.
3. **API routes** – `/api/airports/search` and `/api/airlines/search` are public. If they should only be used when signed in, add `auth()` and return 401 when `!userId`. Middleware matcher already includes `/(api|trpc)(.*)`.
4. **Production env** – Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` (and Clerk envs for sign-in/sign-up URLs) in production; ensure `NEXT_PUBLIC_SITE_URL` is correct for redirects.
5. **Clerk Dashboard** – Configure allowed redirect URLs, email/domain, and password policy (e.g. breached-password checks) in the Clerk dashboard.
6. **`proxy.ts`** – In Next.js 16 this is the correct file for auth middleware (the old `middleware.ts` convention is deprecated).
7. **Inline form errors** – Auth forms still use `text-red-500` / `text-destructive` for field-level validation. For full “soft” consistency you could switch to a muted colour (e.g. `text-amber-700` or `text-muted-foreground`).

## Clerk MCP / docs

- Next.js 16: use `clerkMiddleware()` in **`proxy.ts`** (Next.js 16 uses proxy instead of middleware).
- Server: use `auth()` and `currentUser()` from `@clerk/nextjs/server` in Server Components and API routes.
- Client: use `useAuth`, `useUser`, `useSignIn`, `useSignUp` from `@clerk/nextjs`.
