import { cn } from "@/src/lib/utils";

import { LogoIcon } from "./logo-icon";

type LogoProps = {
  size?: "sm" | "md";
  showText?: boolean;
  className?: string;
};

export function Logo({ showText = true, className }: LogoProps) {
  return (
    <div className={cn("flex items-center justify-center text-center gap-2", className)}>
      <LogoIcon
        iconClassName="size-8"
      />
      {showText && (
        <h1 className="text-xl font-bold tracking-tight text-primary-light">
          Juju Finance
        </h1>
      )}
    </div>
  );
}
