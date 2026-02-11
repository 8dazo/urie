import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const userId = session.user.id;
    await prisma.userSession.deleteMany({ where: { userId } });
    await prisma.user.delete({
      where: { id: userId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/account:", e);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
