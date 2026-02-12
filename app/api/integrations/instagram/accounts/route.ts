import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });
  if (!creator) {
    return NextResponse.json({ accounts: [] });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: {
      creatorId: creator.id,
      platform: "instagram",
      status: "active",
    },
    select: {
      id: true,
      handle: true,
      externalId: true,
      status: true,
      meta: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    accounts: accounts.map((a) => ({
      id: a.id,
      handle: a.handle,
      externalId: a.externalId,
      status: a.status,
      meta: a.meta,
      createdAt: a.createdAt,
    })),
  });
}
