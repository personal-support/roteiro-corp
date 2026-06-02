"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/requests", label: "Solicitações", icon: "✈️" },
  { href: "/requests/new", label: "Nova Solicitação", icon: "➕" },
  { href: "/settings", label: "Configurações", icon: "⚙️" },
];

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  buyer: "Comprador",
  requester: "Solicitante",
  manager: "Gestor",
};

export default function Sidebar({
  profile,
}: {
  profile: Profile & { company?: { name: string } | null };
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <p className="font-bold text-gray-900 text-sm">Roteiro Corp</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {profile.company?.name || "—"}
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-900 truncate">{profile.full_name}</p>
        <p className="text-xs text-gray-500">{roleLabels[profile.role] || profile.role}</p>
        <button
          onClick={handleLogout}
          className="mt-2 w-full text-xs text-gray-500 hover:text-red-600 text-left transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
