import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/session";

const PROTECTED_PAGES = ["/dashboard", "/create"];
const PROTECTED_API_PREFIXES = ["/api/surveys", "/api/chat/creator"];

// GET on exact /api/surveys/[id] is public (survey takers load by shortCode/UUID)
const PUBLIC_GET_API_RE = /^\/api\/surveys\/[^/]+$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = await getCurrentUserFromRequest(req);

  // Protected pages: redirect unauthenticated users to /login
  if (PROTECTED_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protected APIs: return 401 JSON for unauthenticated requests
  if (PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    const isPublicGetOnSurvey = req.method === "GET" && PUBLIC_GET_API_RE.test(pathname);

    if (!isPublicGetOnSurvey && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Inject userId + email headers for downstream route handlers
    if (user) {
      const headers = new Headers(req.headers);
      headers.set("x-user-id", user.userId);
      headers.set("x-user-email", user.email);
      return NextResponse.next({ request: { headers } });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/create/:path*",
    "/api/surveys/:path*",
    "/api/chat/creator",
  ],
};
