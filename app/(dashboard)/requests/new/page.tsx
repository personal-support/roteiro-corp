import TravelRequestForm from "@/components/forms/TravelRequestForm";

export default function NewRequestPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Nova Solicitação de Viagem</h1>
        <p className="text-sm text-gray-500">Preencha os dados e a IA gerará um resumo automático</p>
      </div>
      <TravelRequestForm />
    </div>
  );
}
