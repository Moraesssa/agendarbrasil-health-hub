
import { ArrowLeft, Pill, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MedicationReminders from "@/components/MedicationReminders";
import PrescriptionsList from "@/components/medication/PrescriptionsList";

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

        {/* Main Content with Tabs */}
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="meus-medicamentos" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm">
              <TabsTrigger 
                value="meus-medicamentos" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <Pill className="h-4 w-4" />
                Meus Medicamentos
              </TabsTrigger>
              <TabsTrigger 
                value="prescricoes" 
                className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4" />
                Prescrições Médicas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="meus-medicamentos" className="space-y-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">
                  Lembretes de Medicamentos
                </h2>
                <p className="text-gray-600 mb-6">
                  Gerencie seus medicamentos pessoais, horários e lembretes.
                </p>
                <MedicationReminders />
              </div>
            </TabsContent>

            <TabsContent value="prescricoes" className="space-y-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-green-900 mb-4">
                  Prescrições Médicas
                </h2>
                <p className="text-gray-600 mb-6">
                  Visualize suas receitas médicas, renove prescrições e acompanhe o histórico.
                </p>
                <PrescriptionsList />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GestaoMedicamentos;
