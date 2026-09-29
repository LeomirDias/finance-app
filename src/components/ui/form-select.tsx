"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/src/lib/utils";

export type FormSelectOption = {
  value: string;
  label: string;
};

export function FormSelect({
  id,
  name,
  defaultValue = "",
  options,
  className,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
  options: readonly FormSelectOption[];
  className?: string;
}) {
  return (
    <SelectPrimitive.Root
      name={name}
      defaultValue={defaultValue}
      items={options}
      modal={false}
    >
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 text-left text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-popup-open:ring-2 data-popup-open:ring-primary/40",
          className,
        )}
      >
        <SelectPrimitive.Value className="min-w-0 flex-1 truncate" />
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
          <ChevronDown className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          alignItemWithTrigger={false}
          collisionPadding={12}
          className="z-80 outline-none"
        >
          <SelectPrimitive.Popup className="max-h-[min(15rem,var(--available-height))] w-(--anchor-width) origin-(--transform-origin) overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none">
            <SelectPrimitive.List className="outline-none">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value || "empty"}
                  value={option.value}
                  className="flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-muted"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="size-3.5" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText className="min-w-0 truncate">
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
