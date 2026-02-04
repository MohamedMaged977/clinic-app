import { NextResponse, type NextRequest } from "next/server";

/**
 * Minimal pass-through middleware. Supabase session refresh runs in server
 * components (createClient in lib/supabase/server.ts) to avoid Edge failures
 * that cause MIDDLEWARE_INVOCATION_FAILED on Vercel.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
