export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 p-4">
      {children}
    </div>
  );
}
