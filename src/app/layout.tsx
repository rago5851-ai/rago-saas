import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MobileNav } from "@/components/layout/mobile-nav";

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
      <body className={`${inter.className} bg-gray-50 min-h-screen pb-16`}>
        <main className="mx-auto max-w-md bg-white min-h-screen shadow-sm">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
