import { getWalletsByUser } from "@/src/actions/wallets/get-wallets";
import { requireSession } from "@/src/lib/require-session";
import { PageHeader } from "@/src/components/global/page-header";
import {
  NewWalletButton,
  WalletList,
} from "@/src/app/(app)/wallets/_components/wallet-list";

export default async function WalletsPage() {
  const session = await requireSession();
  const wallets = await getWalletsByUser();

  return (
    <>
      <PageHeader
        title="Carteiras"
        subtitle="Gerencie e alterne entre suas carteiras"
        backHref="/"
        backLabel="Início"
      />

      <main className="page-container space-y-8 pb-20 sm:pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {wallets.length}{" "}
            {wallets.length === 1 ? "carteira" : "carteiras"}
          </p>
          <NewWalletButton />
        </div>

        <WalletList
          wallets={wallets}
          activeWalletId={session.walletId}
        />
      </main>
    </>
  );
}
