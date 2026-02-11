import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    if (!prisma.userSession?.findMany) {
      return NextResponse.json({ sessions: [] });
    }
    const sessions = await prisma.userSession.findMany({
      where: { userId: session.user.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, sessionToken: true, userAgent: true, createdAt: true },
    });
    const currentToken = (session.user as { sessionToken?: string }).sessionToken;
    const list = sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      createdAt: s.createdAt.toISOString(),
      isCurrent: s.sessionToken === currentToken,
    }));
    return NextResponse.json({ sessions: list });
  } catch (e) {
    console.error("GET /api/account/sessions:", e);
    return NextResponse.json(
      { error: "Failed to load sessions" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const sessionToken = searchParams.get("sessionToken");
    if (!id && !sessionToken) {
      return NextResponse.json(
        { error: "id or sessionToken is required" },
        { status: 400 }
      );
    }

    if (!prisma.userSession?.findFirst) {
      return NextResponse.json(
        { error: "Sessions not available" },
        { status: 503 }
      );
    }

    const where: { id?: string; sessionToken?: string; userId: string } = {
      userId: session.user.id,
    };
    if (id) where.id = id;
    if (sessionToken) where.sessionToken = sessionToken;

    const target = await prisma.userSession.findFirst({
      where,
      select: { id: true, sessionToken: true },
    });

    if (!target) {
      return NextResponse.json(
        { error: "Session not found or already revoked" },
        { status: 404 }
      );
    }

    await prisma.userSession.update({
      where: { id: target.id },
      data: { revokedAt: new Date() },
    });

    const currentToken = (session.user as { sessionToken?: string }).sessionToken;
    const wasCurrentSession = target.sessionToken === currentToken;

    return NextResponse.json({
      ok: true,
      revokedCurrentSession: wasCurrentSession,
    });
  } catch (e) {
    console.error("DELETE /api/account/sessions:", e);
    return NextResponse.json(
      { error: "Failed to revoke session" },
      { status: 500 }
    );
  }
}
