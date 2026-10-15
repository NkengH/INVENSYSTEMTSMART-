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
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const role = verified.payload.role as string;
    const mustChangePassword = Boolean(verified.payload.mustChangePassword);

    // If user has a temporary password, enforce password change first
    if (mustChangePassword) {
      if (path === "/change-password" || path.startsWith("/api/auth/")) {
        return NextResponse.next();
      }
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Password change required before accessing this resource", mustChangePassword: true },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/change-password", request.url));
    }

    // If user already has a permanent password and tries to access /change-password, redirect to role dashboard
    if (path === "/change-password") {
      if (role === "Administrator") return NextResponse.redirect(new URL("/admin", request.url));
      if (role === "Inventory Manager") return NextResponse.redirect(new URL("/inventory-manager", request.url));
      if (role === "Cashier") return NextResponse.redirect(new URL("/cashier", request.url));
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Strict role-based route protection with Cashier inheritance
    if (path.startsWith("/admin") && role !== "Administrator") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (path.startsWith("/inventory-manager") && role !== "Inventory Manager") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (
      path.startsWith("/cashier") &&
      role !== "Cashier" &&
      role !== "Inventory Manager" &&
      role !== "Administrator"
    ) {
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
