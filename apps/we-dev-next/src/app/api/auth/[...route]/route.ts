import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import * as authService from "@/services/auth.service";

export async function POST(req: Request) {
  await dbConnect();
  const credentials = await req.json();
  const result = await authService.register(credentials);

  if ("status" in result) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status }
    );
  }
  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  await dbConnect();
  const credentials = await req.json();
  const result = await authService.login(credentials);

  if ("status" in result) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status }
    );
  }
  return NextResponse.json(result);
}

export async function PATCH(req: Request) {
  await dbConnect();
  const credentials = await req.json();
  const result = await authService.updatePassword(credentials);

  if ("status" in result) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status }
    );
  }
  return NextResponse.json(result);
}

