import { NextResponse } from "next/server";
import { connectToDatabase } from "@/db";
import { User } from "@/db/schema";
import * as bcrypt from "bcrypt";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim();
    const prefixUsername = cleanUsername.includes("@") ? cleanUsername.split("@")[0] : cleanUsername;
    const user = await User.findOne({
      $or: [
        { username: cleanUsername },
        { username: prefixUsername },
      ],
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const mustChangePassword = Boolean(user.mustChangePassword);
    await createSession(user._id.toString(), user.role, user.username, mustChangePassword);
    return NextResponse.json({
      success: true,
      mustChangePassword,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
