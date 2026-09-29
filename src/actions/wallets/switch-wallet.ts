"use server";

import { unstable_update } from "@/src/auth";
import { requireSession } from "@/src/lib/require-session";
import { assertWalletMembership } from "@/src/lib/wallet-session";
import {
  SwitchWalletSchema,
  type WalletActionState,
} from "@/src/actions/wallets/wallet-schema";

export async function switchWalletAction(
  _prevState: WalletActionState,
  formData: FormData,
): Promise<WalletActionState> {
  const session = await requireSession();

  const parsed = SwitchWalletSchema.safeParse({
    walletId: formData.get("walletId"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { walletId } = parsed.data;

  try {
    await assertWalletMembership(session.userId, walletId);
    await unstable_update({ walletId });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível trocar de carteira.",
    };
  }

  return { success: true, data: { id: walletId } };
}
