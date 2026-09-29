import { cn } from "@/src/lib/utils";

type LogoIconProps = {
  className?: string;
  iconClassName?: string;
};

export function LogoIcon({ className, iconClassName }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-10 shrink-0", iconClassName, className)}
    >
      <rect width="32" height="32" rx="8" fill="#820AD1" />
      <path
        fill="#F7F1FF"
        d="M8.2 15.6 6.7 7.4c-.18-.9.86-1.48 1.52-.84L12.2 10.4A8.7 8.7 0 0 1 16 9.5c1.35 0 2.62.36 3.72.98l3.95-3.9c.66-.64 1.7-.06 1.52.84L23.8 15.6a8.55 8.55 0 1 1-15.6 0Z"
      />
      <path fill="#D8B4FE" d="M9.15 13.4 8.15 8.7c-.12-.55.52-.9.92-.5l2.15 2.15Z" />
      <path fill="#D8B4FE" d="M22.85 13.4 23.85 8.7c.12-.55-.52-.9-.92-.5l-2.15 2.15Z" />
      <ellipse cx="12.7" cy="17.7" rx="1.35" ry="1.7" fill="#4C0678" />
      <ellipse cx="19.3" cy="17.7" rx="1.35" ry="1.7" fill="#4C0678" />
      <circle cx="12.25" cy="17.15" r="0.42" fill="#fff" />
      <circle cx="18.85" cy="17.15" r="0.42" fill="#fff" />
      <path fill="#C084FC" d="M16 19.7 14.7 21.35h2.6L16 19.7Z" />
    </svg>
  );
}
