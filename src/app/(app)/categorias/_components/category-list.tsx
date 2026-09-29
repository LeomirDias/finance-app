"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { deleteCategoryAction } from "@/src/actions/finance/categories";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export type CategoryListItem = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  color: string | null;
};

const groups = [
  {
    type: "income" as const,
    title: "Ganhos",
    empty: "Nenhuma categoria de ganho.",
  },
  {
    type: "expense" as const,
    title: "Gastos",
    empty: "Nenhuma categoria de gasto.",
  },
];

export function CategoryList({ categories }: { categories: CategoryListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  function handleDelete(category: CategoryListItem) {
    if (
      !window.confirm(
        `Excluir a categoria "${category.name}"? Lançamentos vinculados ficam sem categoria.`,
      )
    ) {
      return;
    }

    setErrorById((current) => {
      const next = { ...current };
      delete next[category.id];
      return next;
    });

    const formData = new FormData();
    formData.set("id", category.id);

    startTransition(async () => {
      const result = await deleteCategoryAction({}, formData);
      if (result.success) {
        router.refresh();
        return;
      }

      setErrorById((current) => ({
        ...current,
        [category.id]: result.error ?? "Não foi possível excluir a categoria.",
      }));
    });
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const items = categories.filter((category) => category.type === group.type);

        return (
          <section key={group.type} className="space-y-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {group.title}
            </h2>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{group.empty}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((category) => {
                  const error = errorById[category.id];

                  return (
                    <li
                      key={category.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-border/60 p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-lg"
                          aria-hidden
                        >
                          {category.icon ?? (
                            <span
                              className="size-3 rounded-full"
                              style={{
                                backgroundColor: category.color ?? "#64748b",
                              }}
                            />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{category.name}</p>
                          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span
                              className="size-2.5 rounded-full"
                              style={{
                                backgroundColor: category.color ?? "#64748b",
                              }}
                              aria-hidden
                            />
                            {group.title}
                          </p>
                          {error && (
                            <p className="mt-2 text-sm text-destructive">{error}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/categorias/${category.id}/edit`}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-10 flex-1 rounded-xl",
                          )}
                        >
                          Editar
                        </Link>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={isPending}
                          className="h-10 rounded-xl"
                          onClick={() => handleDelete(category)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function NewCategoryButton() {
  return (
    <Link
      href="/categorias/new"
      className={cn(
        buttonVariants({ variant: "default" }),
        "h-11 gap-2 rounded-xl font-semibold sm:h-12",
      )}
    >
      <Plus className="size-4" />
      Nova categoria
    </Link>
  );
}
