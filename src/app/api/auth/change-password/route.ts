import { NextResponse } from "next/server";
import { changePassword } from "@/app/actions/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await changePassword({
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      confirmPassword: body.confirmPassword,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to change password" },
      { status: 400 }
    );
  }
}
