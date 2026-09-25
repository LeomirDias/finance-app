"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";

import { signIn } from "@/src/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import {
  loginSchema,
  registerSchema,
} from "@/src/actions/authentication/auth-schema";

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/wallets/select",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }

    throw error;
  }

  return { success: true };
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  if (existingUser) {
    return {
      fieldErrors: {
        email: ["Este e-mail já está em uso."],
      },
    };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  await db.insert(users).values({
    name: parsed.data.name,
    email: parsed.data.email,
    password: hashedPassword,
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/wallets/select",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Conta criada, mas não foi possível entrar automaticamente.",
      };
    }

    throw error;
  }

  return { success: true };
}

export async function logoutAction() {
  const { signOut } = await import("@/src/auth");
  await signOut({ redirectTo: "/login" });
}
