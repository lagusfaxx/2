import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/admin", "/panel-profesional", "/chat", "/favoritos", "/servicios-activos"]; 

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("session");
  const path = request.nextUrl.pathname;

  if (protectedRoutes.some((route) => path.startsWith(route)) && !hasSession) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/panel-profesional/:path*", "/chat/:path*", "/favoritos/:path*", "/servicios-activos/:path*"]
};
