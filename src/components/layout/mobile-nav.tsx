import Link from "next/link";
import { Package, Beaker, ClipboardList, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-gray-200 bg-white pb-safe dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        <Link
          href="/inventory"
          className="flex flex-col items-center justify-center space-y-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500"
        >
          <Package className="h-6 w-6" />
          <span className="text-xs font-medium">Inventario</span>
        </Link>
        <Link
          href="/formulas"
          className="flex flex-col items-center justify-center space-y-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500"
        >
          <Beaker className="h-6 w-6" />
          <span className="text-xs font-medium">Fórmulas</span>
        </Link>
        <Link
          href="/production"
          className="flex flex-col items-center justify-center space-y-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500"
        >
          <ClipboardList className="h-6 w-6" />
          <span className="text-xs font-medium">Lotes</span>
        </Link>
        <form action={logoutAction}>
           <button type="submit" className="flex flex-col items-center justify-center space-y-1 text-red-500 hover:text-red-700 bg-transparent border-0 px-2 mt-2">
             <LogOut className="h-5 w-5" />
             <span className="text-[10px] font-bold">Salir</span>
           </button>
        </form>
      </div>
    </nav>
  );
}
