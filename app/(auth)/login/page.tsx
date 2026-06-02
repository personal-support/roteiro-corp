import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Roteiro Corp</h1>
          <p className="text-sm text-gray-500 mt-1">Gestão de viagens corporativas</p>
        </div>
        <Suspense fallback={<div className="text-sm text-gray-400 text-center">Carregando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
