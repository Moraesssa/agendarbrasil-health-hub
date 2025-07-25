
import { useState } from "react";
import { FileText, Search, Plus, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCertificateManagement } from "@/hooks/useCertificateManagement";
import { useFamilyManagement } from "@/hooks/useFamilyManagement";
import CertificateCard from "@/components/certificates/CertificateCard";
import CreateCertificateDialog from "@/components/certificates/CreateCertificateDialog";
import DocumentValidator from "@/components/certificates/DocumentValidator";
import { useAuth } from "@/contexts/AuthContext";

const GerenciarAtestados = () => {
  const { user } = useAuth();
  const {
    certificates,
    loading,
    isSubmitting,
    createCertificate,
    validateDocument
  } = useCertificateManagement();
  
  const { familyMembers } = useFamilyManagement();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState("");

  const isDoctor = user?.user_metadata?.user_type === 'medico';

  const filteredCertificates = certificates.filter(certificate => {
    const matchesSearch = certificate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "all" || certificate.certificate_type === selectedType;
    
    const matchesPatient = selectedPatient === "" || certificate.patient_id === selectedPatient;
    
    return matchesSearch && matchesType && matchesPatient;
  });

  const certificateTypes = [
    { value: "all", label: "Todos os tipos" },
    { value: "medical_leave", label: "Atestado de Afastamento" },
    { value: "fitness_certificate", label: "Atestado de Aptidão" },
    { value: "vaccination_certificate", label: "Atestado de Vacinação" },
    { value: "medical_report", label: "Relatório Médico" }
  ];

  const stats = {
    total: certificates.length,
    thisMonth: certificates.filter(cert => {
      const certDate = new Date(cert.created_at);
      const now = new Date();
      return certDate.getMonth() === now.getMonth() && certDate.getFullYear() === now.getFullYear();
    }).length,
    active: certificates.filter(cert => cert.is_active).length,
    byType: certificateTypes.slice(1).map(type => ({
      type: type.label,
      count: certificates.filter(cert => cert.certificate_type === type.value).length
    }))
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">
          {isDoctor ? "Gerenciar Atestados" : "Meus Atestados"}
        </h1>
        <p className="text-gray-600">
          {isDoctor ? "Crie e gerencie atestados médicos para seus pacientes" : "Visualize e baixe seus atestados médicos"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-sm text-blue-700">Total de Atestados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-900">{stats.thisMonth}</p>
              <p className="text-sm text-green-700">Este Mês</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 flex items-center gap-3">
            <User className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-900">{stats.active}</p>
              <p className="text-sm text-purple-700">Ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Search className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-900">{filteredCertificates.length}</p>
              <p className="text-sm text-yellow-700">Filtrados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="certificates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="certificates">Atestados</TabsTrigger>
          <TabsTrigger value="validate">Validar Documento</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Pesquisar atestados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de atestado" />
              </SelectTrigger>
              <SelectContent>
                {certificateTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isDoctor && familyMembers.length > 0 && (
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os pacientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os pacientes</SelectItem>
                  {familyMembers.map((member) => (
                    <SelectItem key={member.family_member_id} value={member.family_member_id}>
                      {member.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {isDoctor && (
              <CreateCertificateDialog
                patientId={selectedPatient || user?.id || ""}
                patientName={selectedPatient ? familyMembers.find(m => m.family_member_id === selectedPatient)?.display_name || "" : "Selecione um paciente"}
                onCreateCertificate={createCertificate}
                isLoading={isSubmitting}
              />
            )}
          </div>

          {/* Certificates List */}
          {filteredCertificates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum atestado encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  {isDoctor ? "Você ainda não criou nenhum atestado médico." : "Você ainda não possui atestados médicos."}
                </p>
                {isDoctor && (
                  <CreateCertificateDialog
                    patientId={user?.id || ""}
                    patientName="Paciente"
                    onCreateCertificate={createCertificate}
                    isLoading={isSubmitting}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredCertificates.map((certificate) => (
                <CertificateCard
                  key={certificate.id}
                  certificate={certificate}
                  showPatientInfo={isDoctor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="validate" className="space-y-6">
          <DocumentValidator
            onValidate={validateDocument}
            isLoading={isSubmitting}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GerenciarAtestados;
