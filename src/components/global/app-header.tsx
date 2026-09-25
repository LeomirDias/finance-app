import { getFirstName } from "@/src/lib/helpers/format";

type AppHeaderProps = {
  userName?: string | null;
};

export function AppHeader({ userName }: AppHeaderProps) {
  return (
    <header className="w-full">
      <div className="flex items-center justify-between p-2 pr-4">
        <div className="ml-1 md:ml-4">
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="text-xl font-semibold tracking-tight">
            {getFirstName(userName)}
          </h1>
        </div>
      </div>
    </header>
  );
}
