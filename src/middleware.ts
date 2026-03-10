import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/chat",
  "/knowledge-base",
  "/settings",
  "/onboarding",
  "/content-engine",
  "/roundtable",
  "/documents",
  "/feedback",
  "/pricing",
  "/goals",
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];

// Routes exempt from onboarding redirect (user needs access even if onboarding incomplete)
const onboardingExemptRoutes = ["/onboarding", "/settings", "/api"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isOnboardingExempt = onboardingExemptRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route while not logged in
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // Redirect to onboarding if logged in but hasn't completed onboarding
  // Uses strict === false so existing tokens without the field aren't affected
  // Also checks for the short-lived "onboarding_done" cookie set by the
  // skip/complete API — this prevents a redirect loop when the JWT hasn't
  // been refreshed yet but the DB already has onboardingCompleted=true.
  const onboardingDone = req.cookies.get("onboarding_done")?.value === "1";
  if (
    isLoggedIn &&
    isProtectedRoute &&
    !isOnboardingExempt &&
    req.auth?.user?.onboardingCompleted === false &&
    !onboardingDone
  ) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl.origin));
  }

  // If the bypass cookie was used, clear it so it doesn't persist
  const response = NextResponse.next();
  if (onboardingDone) {
    response.cookies.delete("onboarding_done");
  }
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes (except auth)
    "/(api(?!/auth))(.*)",
  ],
};
