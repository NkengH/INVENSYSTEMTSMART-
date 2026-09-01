import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development_only");

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths — no auth required
  if (
    path === "/" ||
    path.startsWith("/api/auth") ||
    path.startsWith("/api/setup") ||
    path.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const role = verified.payload.role as string;

    // Strict role-based route protection (3 core actors)
    if (path.startsWith("/admin") && role !== "Administrator") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (path.startsWith("/inventory-manager") && role !== "Inventory Manager") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (path.startsWith("/cashier") && role !== "Cashier") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Redirect legacy stock-controller and storekeeper routes to inventory-manager or home
    if (path.startsWith("/stock-controller") || path.startsWith("/storekeeper")) {
      if (role === "Inventory Manager") {
        return NextResponse.redirect(new URL("/inventory-manager", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
