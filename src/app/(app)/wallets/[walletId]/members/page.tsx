import { notFound } from "next/navigation";

import { auth } from "@/src/auth";
import { getWalletMembers } from "@/src/actions/wallets/get-wallet-members";
import { db } from "@/src/db";
import { walletsMembers } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { PageHeader } from "@/src/components/global/page-header";
import { WalletMemberCard } from "@/src/app/(app)/wallets/_components/wallet-member-card";
import { WalletMemberForm } from "@/src/app/(app)/wallets/_components/wallet-member-form";

type WalletMembersPageProps = {
  params: Promise<{ walletId: string }>;
};

export default async function WalletMembersPage({
  params,
}: WalletMembersPageProps) {
  const { walletId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const membership = await db.query.walletsMembers.findFirst({
    where: and(
      eq(walletsMembers.walletId, walletId),
      eq(walletsMembers.userId, session.user.id),
    ),
    with: {
      wallet: true,
    },
  });

  if (!membership) {
    notFound();
  }

  const members = await getWalletMembers(walletId);

  return (
    <>
      <PageHeader
        subtitle={membership.wallet.name}
        title="Membros"
        backHref="/wallets"
        backLabel="Carteiras"
      />

      <main className="content-container">
        <div className="grid gap-6 lg:grid-cols-[1fr_--spacing(96)] lg:items-start">
          <section className="grid gap-3">
            {members.map((member) => (
              <WalletMemberCard
                key={member.id}
                member={member}
                isCurrentUser={member.userId === session.user.id}
                canRemove
              />
            ))}
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-6 lg:sticky lg:top-6">
            <h2 className="mb-4 font-semibold">Adicionar membro</h2>
            <WalletMemberForm walletId={walletId} />
          </section>
        </div>
      </main>
    </>
  );
}
