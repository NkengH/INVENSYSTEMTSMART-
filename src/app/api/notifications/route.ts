import { NextResponse } from "next/server";
import {
  getLiveNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/actions/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notifications = await getLiveNotifications();
    return NextResponse.json(
      { success: true, notifications },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, ids } = body;

    if (action === "markRead" && id) {
      await markNotificationRead(id);
      return NextResponse.json({ success: true });
    }

    if (action === "markAllRead") {
      await markAllNotificationsRead(ids);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}
