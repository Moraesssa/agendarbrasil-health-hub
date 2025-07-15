import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import PrescriptionCard from "./PrescriptionCard";
import PrescriptionHistoryDialog from "./PrescriptionHistoryDialog";
import { usePrescriptionManagement } from "@/hooks/usePrescriptionManagement";

const PrescriptionsList = () => {
  const {
    prescriptions,
    loading,
    isSubmitting,
    requestRenewal,
    getPrescriptionHistory,
    getExpiringSoon,
    getPendingRenewals
  } = usePrescriptionManagement();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);

  const expiringSoon = getExpiringSoon();
  const pendingRenewals = getPendingRenewals();

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (prescription.doctor_name && prescription.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    switch (statusFilter) {
      case "active":
        return prescription.is_active && (!prescription.valid_until || new Date(prescription.valid_until) >= new Date());
      case "expired":
        return prescription.valid_until && new Date(prescription.valid_until) < new Date();
      case "inactive":
        return !prescription.is_active;
      default:
        return true;
    }
  });

  const handleRequestRenewal = async (prescriptionId: string) => {
    await requestRenewal({ prescription_id: prescriptionId });
  };

  const handleViewHistory = async (medicationName: string) => {
    setSelectedMedication(medicationName);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {(expiringSoon.length > 0 || pendingRenewals.length > 0) && (
        <div className="space-y-3">
          {expiringSoon.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">
                    Prescrições expirando em breve
                  </span>
                </div>
                <p className="text-sm text-yellow-700">
                  {expiringSoon.length} prescrição(ões) expira(m) nos próximos 7 dias
                </p>
              </CardContent>
            </Card>
          )}
          
          {pendingRenewals.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Renovações pendentes
                  </span>
                </div>
                <p className="text-sm text-blue-700">
                  {pendingRenewals.length} solicitação(ões) de renovação aguardando aprovação
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por medicamento ou médico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 && !loading ? (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma prescrição encontrada
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all" 
                ? "Tente ajustar os filtros de busca" 
                : "Você ainda não possui prescrições médicas cadastradas"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => (
            <PrescriptionCard
              key={prescription.id}
              prescription={prescription}
              onRequestRenewal={handleRequestRenewal}
              onViewHistory={handleViewHistory}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}

      {/* History Dialog */}
      {selectedMedication && (
        <PrescriptionHistoryDialog
          medicationName={selectedMedication}
          onGetHistory={getPrescriptionHistory}
        />
      )}
    </div>
  );
};

export default PrescriptionsList;
