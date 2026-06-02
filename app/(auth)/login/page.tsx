import { Suspense } from "react";
import Image from "next/image";
import AuthTabs from "./AuthTabs";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#ebeff2] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-[#212771] rounded-2xl p-4 mb-4 shadow-lg">
            <Image src="/logo.svg" alt="Roteiro Corp" width={140} height={32} className="brightness-0 invert" />
          </div>
          <p className="text-sm text-[#555555]">Gestão de viagens corporativas</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#dddddd] p-8">
          <Suspense fallback={<div className="text-sm text-gray-400 text-center py-4">Carregando...</div>}>
            <AuthTabs />
          </Suspense>
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Desenvolvido por{" "}
          <a href="https://wa.me/5511957737933" target="_blank" rel="noopener noreferrer"
            className="text-[#f86924] font-semibold hover:underline">
            J.Lopes Personal Support
          </a>
        </p>
      </div>
    </div>
  );
}
