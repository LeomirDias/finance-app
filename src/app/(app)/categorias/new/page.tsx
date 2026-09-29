import type { Metadata } from "next";

import { CategoryForm } from "@/src/app/(app)/categorias/_components/category-form";

export const metadata: Metadata = {
  title: "Nova categoria",
};
import { PageHeader } from "@/src/components/global/page-header";

export default function NewCategoryPage() {
  return (
    <>
      <PageHeader
        title="Nova categoria"
        backHref="/categorias"
        backLabel="Categorias"
      />

      <main className="content-container pb-20 sm:pb-10">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <CategoryForm />
        </div>
      </main>
    </>
  );
}
