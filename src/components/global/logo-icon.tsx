import { Cat } from "lucide-react";

import { cn } from "@/src/lib/utils";

type LogoIconProps = {
  className?: string;
  iconClassName?: string;
};

export function LogoIcon({ className, iconClassName }: LogoIconProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-transparent ring-0",
        className
      )}
    >
      <Cat className={cn("size-10 text-primary-light", iconClassName)} strokeWidth={2} />
    </div>
  );
}
