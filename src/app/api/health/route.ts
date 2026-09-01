import { connectToDatabase } from "@/db";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
      return Response.json({ ok: true, database: "mongodb", status: "connected" });
    }
    return Response.json({ ok: false, database: "mongodb", status: "connecting/disconnected" }, { status: 503 });
  } catch (error: any) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
