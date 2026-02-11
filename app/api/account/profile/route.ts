import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, profile: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const profile =
      user.profile && typeof user.profile === "object"
        ? (user.profile as { name?: string; avatar?: string; bio?: string })
        : undefined;
    return NextResponse.json({
      id: user.id,
      email: user.email,
      profile: profile ?? { name: null, avatar: null, bio: null },
    });
  } catch (e) {
    console.error("GET /api/account/profile:", e);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Max avatar length (base64 data URL); ~384px JPEG is typically under 100KB */
const MAX_AVATAR_LENGTH = 512 * 1024;

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    let avatar = typeof body.avatar === "string" ? body.avatar.trim() : undefined;
    if (avatar !== undefined && avatar.length > MAX_AVATAR_LENGTH) {
      return NextResponse.json(
        { error: "Avatar image is too large. Use a smaller image." },
        { status: 400 }
      );
    }
    const bio = typeof body.bio === "string" ? body.bio.trim() : undefined;

    if (email !== undefined) {
      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
      const existing = await prisma.user.findUnique({
        where: { email },
      });
      if (existing && existing.id !== session.user.id) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
    }

    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profile: true },
    });
    const currentProfile =
      current?.profile && typeof current.profile === "object"
        ? (current.profile as { name?: string; avatar?: string; bio?: string })
        : {};

    const profile = {
      ...currentProfile,
      ...(name !== undefined && { name: name || null }),
      ...(avatar !== undefined && { avatar: avatar || null }),
      ...(bio !== undefined && { bio: bio || null }),
    };

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(email !== undefined && { email }),
        profile,
      },
      select: { id: true, email: true, profile: true },
    });

    const outProfile =
      updated.profile && typeof updated.profile === "object"
        ? (updated.profile as { name?: string; avatar?: string; bio?: string })
        : undefined;
    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      profile: outProfile ?? { name: null, avatar: null, bio: null },
    });
  } catch (e) {
    console.error("PATCH /api/account/profile:", e);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
