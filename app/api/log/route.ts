// app/api/log/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/db";

export async function POST(request: Request) {
  try {
    const { type, message } = await request.json();
    const { db } = await connectToDatabase();
    
    await db.collection("logs").insertOne({
      type,
      message,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}