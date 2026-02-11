import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        profile: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(users);
  } catch (e) {
    console.error("API users GET:", e);
    return NextResponse.json(
      { error: "Failed to load users. Ensure MONGODB_URI includes a database name and run: npx prisma db push && npx prisma db seed" },
      { status: 500 }
    );
  }
}
