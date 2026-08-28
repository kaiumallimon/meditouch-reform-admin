import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediTouch Admin Portal",
  description: "Rural & Underserved Telemedicine and E-Pharmacy Management Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
