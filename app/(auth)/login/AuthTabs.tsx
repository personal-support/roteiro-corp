"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "login" | "register" | "forgot";

export default function AuthTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  function resetState() {
    setError(null);
    setSuccess(null);
  }

  function switchTab(t: Tab) {
    setTab(t);
    resetState();
  }

  // LOGIN
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    resetState();

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    router.push(returnUrl);
    router.refresh();
  }

  // CADASTRO
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    resetState();

    if (!fullName.trim()) {
      setError("Informe seu nome completo.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    // Login automático após cadastro
    const supabase = createClient();
    await supabase.auth.signInWithPassword({ email, password });
    router.push("/dashboard");
    router.refresh();
  }

  // RECUPERAÇÃO DE SENHA
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    resetState();

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError("Erro ao enviar e-mail. Verifique o endereço.");
      return;
    }

    setSuccess("E-mail de recuperação enviado. Verifique sua caixa de entrada.");
  }

  return (
    <div>
      {/* Tabs — só Login e Cadastro */}
      {tab !== "forgot" && (
        <div className="flex border-b border-gray-200 mb-6">
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>
      )}

      {/* FORM LOGIN */}
      {tab === "login" && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@empresa.com.br"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <button
            type="button"
            onClick={() => switchTab("forgot")}
            className="w-full text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            Esqueci minha senha
          </button>
        </form>
      )}

      {/* FORM CADASTRO */}
      {tab === "register" && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Seu nome completo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail corporativo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@empresa.com.br"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Ao criar conta, você concorda com os termos de uso da plataforma.
          </p>
        </form>
      )}

      {/* FORM RECUPERAÇÃO */}
      {tab === "forgot" && (
        <div className="space-y-4">
          <div>
            <button
              onClick={() => switchTab("login")}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
            >
              ← Voltar ao login
            </button>
            <h2 className="text-base font-semibold text-gray-900">Recuperar senha</h2>
            <p className="text-sm text-gray-500 mt-1">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@empresa.com.br"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
