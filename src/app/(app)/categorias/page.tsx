import type { Metadata } from "next";

import { listCategories } from "@/src/actions/finance/queries";

export const metadata: Metadata = {
  title: "Categorias",
};
import {
  CategoryList,
  NewCategoryButton,
} from "@/src/app/(app)/categorias/_components/category-list";
import { PageHeader } from "@/src/components/global/page-header";

export default async function CategoriasPage() {
  const categories = await listCategories();

  return (
    <>
      <PageHeader
        title="Categorias"
        subtitle="Organize os ganhos e gastos da carteira"
        backHref="/"
        backLabel="Início"
      />

      <main className="page-container space-y-8 pb-20 sm:pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {categories.length}{" "}
            {categories.length === 1 ? "categoria" : "categorias"}
          </p>
          <NewCategoryButton />
        </div>

        <CategoryList
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            type: category.type,
            icon: category.icon,
            color: category.color,
          }))}
        />
      </main>
    </>
  );
}
