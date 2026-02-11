import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const agencies = await prisma.agency.findMany({
      include: {
        owner: { select: { id: true, email: true, profile: true, role: true } },
        members: { include: { user: { select: { id: true, email: true, profile: true, role: true } } } },
        creators: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
            socialAccounts: { select: { id: true, platform: true, handle: true, status: true } },
          },
        },
        campaigns: { select: { id: true, name: true, status: true, platforms: true } },
        _count: { select: { contentTasks: true } },
      },
    });
    return NextResponse.json(agencies);
  } catch (e) {
    console.error("API agency GET:", e);
    return NextResponse.json(
      { error: "Failed to load agencies. Ensure MONGODB_URI includes a database name (e.g. .../urie?...) and run: npx prisma db push && npx prisma db seed" },
      { status: 500 }
    );
  }
}
