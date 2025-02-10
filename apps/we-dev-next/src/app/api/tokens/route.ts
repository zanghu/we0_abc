import dbConnect from "@/utils/dbConnect";
import TokenAllowance from "@/models/TokenAllowance";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const userId = request.headers.get("userId");

    const currentMonth = new Date().toISOString().slice(0, 7);

    let tokenAllowance = await TokenAllowance.findOne({
      userId,
      monthYear: currentMonth,
    });

    if (!tokenAllowance) {
      tokenAllowance = {
        tokensUsed: 0,
        monthlyLimit: 100000,
        monthYear: currentMonth,
      };
    }

    return NextResponse.json(tokenAllowance);
  } catch (error) {
    console.error("Error fetching token usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch token usage" },
      { status: 500 }
    );
  }
}
