import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });
  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const account = await prisma.socialAccount.findFirst({
    where: {
      id,
      creatorId: creator.id,
      platform: "instagram",
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  await prisma.socialAccount.update({
    where: { id },
    data: {
      status: "revoked",
      accessToken: null,
    },
  });

  return NextResponse.json({ success: true });
}
