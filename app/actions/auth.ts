"use server";

import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

const SALT_ROUNDS = 10;

export async function loginAction(formData: FormData) {
  const email = formData.get("email")?.toString()?.trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  if (!email || !password) return;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid");
    }
    throw error;
  }
}

export async function signupAction(formData: FormData) {
  const email = formData.get("email")?.toString()?.trim()?.toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const name = formData.get("name")?.toString()?.trim() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  if (!email || !password) {
    redirect("/signup?error=" + encodeURIComponent("Email and password are required"));
  }
  if (password.length < 8) {
    redirect("/signup?error=" + encodeURIComponent("Password must be at least 8 characters"));
  }
  if (password !== confirmPassword) {
    redirect("/signup?error=" + encodeURIComponent("Passwords do not match"));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/signup?error=" + encodeURIComponent("An account with this email already exists"));
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "agency_user",
      profile: name ? { name, avatar: null, bio: null } : undefined,
    },
  });

  redirect("/login?registered=1");
}
