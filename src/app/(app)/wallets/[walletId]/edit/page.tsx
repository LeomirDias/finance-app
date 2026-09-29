import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Editar carteira",
};
import { and, eq } from "drizzle-orm";

import { requireSession } from "@/src/lib/require-session";
import { db } from "@/src/db";
import { walletsMembers } from "@/src/db/schema";
import { PageHeader } from "@/src/components/global/page-header";
import { WalletForm } from "@/src/app/(app)/wallets/_components/wallet-form";

type EditWalletPageProps = {
  params: Promise<{ walletId: string }>;
};

export default async function EditWalletPage({ params }: EditWalletPageProps) {
  const { walletId } = await params;
  const session = await requireSession();

  const membership = await db.query.walletsMembers.findFirst({
    where: and(
      eq(walletsMembers.walletId, walletId),
      eq(walletsMembers.userId, session.userId),
    ),
    with: {
      wallet: true,
    },
  });

  if (!membership) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Editar carteira"
        backHref="/wallets"
        backLabel="Carteiras"
      />

      <main className="content-container">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <WalletForm
            walletId={membership.wallet.id}
            defaultName={membership.wallet.name}
            defaultStatus={membership.wallet.status}
            redirectOnSuccess="/wallets"
          />
        </div>
      </main>
    </>
  );
}
