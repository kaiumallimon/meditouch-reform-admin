import * as React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="cream-auth-bg flex min-h-screen items-center justify-center p-4 selection:bg-amber-200">
      {children}
    </div>
  );
}
