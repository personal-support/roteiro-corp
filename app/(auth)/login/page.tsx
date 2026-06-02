import { Suspense } from "react";
import AuthTabs from "./AuthTabs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Roteiro Corp</h1>
          <p className="text-sm text-gray-500 mt-1">Gestão de viagens corporativas</p>
        </div>
        <Suspense fallback={<div className="text-sm text-gray-400 text-center py-4">Carregando...</div>}>
          <AuthTabs />
        </Suspense>
      </div>
    </div>
  );
}
