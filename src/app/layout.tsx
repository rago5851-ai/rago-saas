import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rago POS",
  description: "Sistema de Punto de Venta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 min-h-screen pb-16 lg:pb-0`}>
        <AppShell>
          <main className="mx-auto max-w-md lg:max-w-none bg-white lg:bg-slate-50/50 min-h-screen shadow-sm lg:shadow-none">
            {children}
          </main>
        </AppShell>
      </body>
    </html>
  );
}
