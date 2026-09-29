"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { upsertCategoryAction } from "@/src/actions/finance/categories";
import type { FinanceActionState } from "@/src/actions/finance/finance-schema";
import { Button } from "@/src/components/ui/button";
import { FormSelect } from "@/src/components/ui/form-select";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";

const initialState: FinanceActionState = {};

const typeOptions = [
  { value: "income", label: "Ganho" },
  { value: "expense", label: "Gasto" },
] as const;

const colorOptions = [
  { value: "#22c55e", label: "Verde" },
  { value: "#14b8a6", label: "Verde-água" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#f59e0b", label: "Âmbar" },
  { value: "#f97316", label: "Laranja" },
  { value: "#f43f5e", label: "Rosa" },
  { value: "#64748b", label: "Cinza" },
] as const;

const iconOptions = [
  "💰",
  "🏠",
  "🍔",
  "🚗",
  "💊",
  "🎬",
  "📱",
  "🛒",
  "✈️",
  "🐶",
  "📚",
  "⚡",
] as const;

type CategoryFormProps = {
  categoryId?: string;
  defaultName?: string;
  defaultType?: "income" | "expense";
  defaultIcon?: string;
  defaultColor?: string;
};

export function CategoryForm({
  categoryId,
  defaultName = "",
  defaultType = "expense",
  defaultIcon = "",
  defaultColor = "#64748b",
}: CategoryFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    upsertCategoryAction,
    initialState,
  );
  const [icon, setIcon] = useState(defaultIcon);
  const [color, setColor] = useState(defaultColor);

  useEffect(() => {
    if (state.success) {
      router.push("/categorias");
      router.refresh();
    }
  }, [state.success, router]);

  const isEditing = Boolean(categoryId);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      {categoryId && <input type="hidden" name="id" value={categoryId} />}
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="color" value={color} />

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={defaultName}
          placeholder="Ex.: Mercado"
          autoComplete="off"
          aria-invalid={!!state.fieldErrors?.name}
          className="h-11 rounded-xl text-base"
        />
        {state.fieldErrors?.name?.[0] && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <FormSelect
          id="type"
          name="type"
          defaultValue={defaultType}
          options={typeOptions}
        />
        {state.fieldErrors?.type?.[0] && (
          <p className="text-sm text-destructive">{state.fieldErrors.type[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon-input">Ícone (opcional)</Label>
        <div className="grid grid-cols-6 gap-2">
          {iconOptions.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`Usar ícone ${option}`}
              aria-pressed={icon === option}
              onClick={() => setIcon(icon === option ? "" : option)}
              className={cn(
                "flex h-11 items-center justify-center rounded-xl border text-lg",
                icon === option
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <Input
          id="icon-input"
          value={icon}
          onChange={(event) => setIcon(event.target.value)}
          placeholder="Ou digite um emoji"
          autoComplete="off"
          aria-invalid={!!state.fieldErrors?.icon}
          className="h-11 rounded-xl text-base"
        />
        {state.fieldErrors?.icon?.[0] && (
          <p className="text-sm text-destructive">{state.fieldErrors.icon[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="color-input">Cor</Label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={option.label}
              aria-pressed={color.toLowerCase() === option.value}
              onClick={() => setColor(option.value)}
              className={cn(
                "size-9 rounded-full border-2 border-background ring-2",
                color.toLowerCase() === option.value
                  ? "ring-primary"
                  : "ring-transparent",
              )}
              style={{ backgroundColor: option.value }}
            />
          ))}
          <input
            id="color-input"
            type="color"
            value={/^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#64748b"}
            onChange={(event) => setColor(event.target.value)}
            aria-label="Cor personalizada"
            className="size-9 cursor-pointer rounded-full border border-border bg-background p-1"
          />
        </div>
        {state.fieldErrors?.color?.[0] && (
          <p className="text-sm text-destructive">{state.fieldErrors.color[0]}</p>
        )}
      </div>

      {state.error && (
        <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-xl text-base font-semibold"
      >
        {isPending
          ? "Salvando..."
          : isEditing
            ? "Salvar alterações"
            : "Criar categoria"}
      </Button>
    </form>
  );
}
