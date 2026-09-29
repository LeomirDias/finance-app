import type { Metadata } from "next";

import { PageHeader } from "@/src/components/global/page-header";

export const metadata: Metadata = {
  title: "Nova carteira",
};
import { WalletForm } from "@/src/app/(app)/wallets/_components/wallet-form";

export default function NewWalletPage() {
  return (
    <>
      <PageHeader
        title="Nova carteira"
        backHref="/wallets"
        backLabel="Carteiras"
      />

      <main className="content-container">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <WalletForm redirectOnSuccess="/wallets" />
        </div>
      </main>
    </>
  );
}
