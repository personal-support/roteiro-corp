"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  admin: "Administrador", buyer: "Comprador",
  requester: "Solicitante", manager: "Gestor",
};

export default function Sidebar({
  profile,
}: {
  profile: Profile & { company?: { name: string } | null };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header com logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <Image src="/logo.svg" alt="Roteiro Corp" width={120} height={28} className="brightness-0 invert" />
        </div>
        <p className="text-xs text-white/50 truncate mt-1">{profile.company?.name || "—"}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "bg-[#f86924] text-white font-semibold shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs font-semibold text-white truncate">{profile.full_name}</p>
        <p className="text-xs text-white/50">{roleLabels[profile.role] || profile.role}</p>
        <button onClick={handleLogout}
          className="mt-3 w-full text-xs text-white/40 hover:text-white/80 text-left transition-colors">
          Sair →
        </button>
        {/* Rodapé Personal Support */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs text-white/30 leading-tight">
            Desenvolvido por<br/>
            <span className="text-white/50 font-semibold">J.Lopes Personal Support</span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-[#212771] h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile: botão hamburguer */}
      <div className="md:hidden">
        <button onClick={() => setOpen(true)}
          className="fixed top-4 left-4 z-50 bg-[#212771] text-white p-2 rounded-lg shadow-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Overlay */}
        {open && (
          <div className="fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <aside className="relative w-64 bg-[#212771] h-full flex flex-col z-50 shadow-2xl">
              <button onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <SidebarContent />
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
