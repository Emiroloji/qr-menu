export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
