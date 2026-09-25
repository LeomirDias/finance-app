import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Voltar",
  action,
}: PageHeaderProps) {
  return (
    <header className="relative z-10 px-4 pt-2 pb-1 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-none items-start justify-between gap-4">
        <div className="min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-primary-light transition-opacity hover:opacity-80"
            >
              <ChevronLeft className="size-3.5" />
              {backLabel}
            </Link>
          )}
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
