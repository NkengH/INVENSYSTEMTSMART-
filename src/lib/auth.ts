import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/db";
import { User } from "@/db/schema";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development_only");

export async function createSession(
  userId: string,
  role: string,
  username: string,
  mustChangePassword: boolean = false
) {
  const token = await new SignJWT({ userId, role, username, mustChangePassword })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(JWT_SECRET);

  (await cookies()).set("session", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as {
      userId: string;
      role: string;
      username: string;
      mustChangePassword?: boolean;
    };
  } catch (err) {
    return null;
  }
}

export async function logout() {
  (await cookies()).delete("session");
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  await connectToDatabase();
  const user = await User.findById(session.userId).lean();
  if (!user) return null;
  return {
    ...user,
    id: user._id.toString(),
  };
}
