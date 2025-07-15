
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import MedicationReminders from "@/components/MedicationReminders";

const GestaoMedicamentos = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
            Gestão de Medicamentos
          </h1>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <MedicationReminders />
        </div>
      </div>
    </div>
  );
};

export default GestaoMedicamentos;
