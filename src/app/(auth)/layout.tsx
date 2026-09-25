export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background font-sans">
      <div className="w-full max-w-md px-6 py-12">{children}</div>
    </div>
  );
}
