export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import dbConnect from "@/utils/dbConnect";
import User from "@/models/User";
import { verifyToken } from "@/utils/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);
    const userId = payload.userId;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in /api/user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
