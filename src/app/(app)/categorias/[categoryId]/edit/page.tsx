import { notFound } from "next/navigation";

import { getCategoryById } from "@/src/actions/finance/categories";
import { CategoryForm } from "@/src/app/(app)/categorias/_components/category-form";
import { PageHeader } from "@/src/components/global/page-header";

type EditCategoryPageProps = {
  params: Promise<{ categoryId: string }>;
};

function fallbackColor(color: string | null) {
  return color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#64748b";
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { categoryId } = await params;
  const category = await getCategoryById(categoryId);

  if (!category) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Editar categoria"
        backHref="/categorias"
        backLabel="Categorias"
      />

      <main className="content-container pb-20 sm:pb-10">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <CategoryForm
            categoryId={category.id}
            defaultName={category.name}
            defaultType={category.type}
            defaultIcon={category.icon ?? ""}
            defaultColor={fallbackColor(category.color)}
          />
        </div>
      </main>
    </>
  );
}
