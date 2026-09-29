"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import {
  createDatabaseSession,
  destroyDatabaseSession,
  ensureCredentialsAccount,
  isUniqueViolation,
} from "@/src/lib/credentials-session";
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

  const user = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  if (!user?.password) {
    return { error: "E-mail ou senha inválidos." };
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.password);

  if (!isValid) {
    return { error: "E-mail ou senha inválidos." };
  }

  try {
    await ensureCredentialsAccount(user.id);
    await createDatabaseSession(user.id);
  } catch {
    return { error: "Não foi possível iniciar a sessão." };
  }

  redirect("/wallets/select");
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

  let createdId: string;

  try {
    const [created] = await db
      .insert(users)
      .values({
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
      })
      .returning({ id: users.id });

    if (!created) {
      return { error: "Não foi possível criar a conta." };
    }

    createdId = created.id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        fieldErrors: {
          email: ["Este e-mail já está em uso."],
        },
      };
    }

    throw error;
  }

  try {
    await ensureCredentialsAccount(createdId);
    await createDatabaseSession(createdId);
  } catch {
    return {
      error: "Conta criada, mas não foi possível entrar automaticamente.",
    };
  }

  redirect("/wallets/select");
}

export async function logoutAction() {
  await destroyDatabaseSession();
  redirect("/login");
}
