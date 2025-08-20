import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Heart, 
  Pill, 
  Activity, 
  Calendar,
  User,
  Phone,
  MapPin,
  AlertCircle,
  Download,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PatientMedicalRecordProps {
  patientId: string;
  appointmentId: string;
}

interface PatientData {
  id: string;
  display_name: string;
  email: string;
  telefone?: string;
  endereco?: string;
  data_nascimento?: string;
  genero?: string;
}

interface MedicalHistory {
  allergies: string[];
  medications: string[];
  conditions: string[];
  lastExams: any[];
  consultations: any[];
}

export const PatientMedicalRecord: React.FC<PatientMedicalRecordProps> = ({
  patientId,
  appointmentId
}) => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>({
    allergies: [],
    medications: [],
    conditions: [],
    lastExams: [],
    consultations: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadPatientData();
    loadMedicalHistory();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatientData(data);
    } catch (error) {
      console.error('Erro ao carregar dados do paciente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do paciente",
        variant: "destructive"
      });
    }
  };

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      
      // Load consultations
      const { data: consultations, error: consultError } = await supabase
        .from('consultas')
        .select(`
          *,
          medico:medicos!inner(dados_profissionais)
        `)
        .eq('paciente_id', patientId)
        .order('consultation_date', { ascending: false })
        .limit(10);

      if (consultError) throw consultError;

      // Mock data for demonstration - in real app, fetch from respective tables
      setMedicalHistory({
        allergies: ["Penicilina", "Poeira"],
        medications: ["Losartana 50mg - 1x ao dia", "Metformina 850mg - 2x ao dia"],
        conditions: ["Hipertensão", "Diabetes tipo 2"],
        lastExams: [
          { type: "Hemograma Completo", date: "2024-01-15", result: "Normal" },
          { type: "Glicemia", date: "2024-01-20", result: "120 mg/dL" }
        ],
        consultations: consultations || []
      });
    } catch (error) {
      console.error('Erro ao carregar histórico médico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico médico",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  if (loading) {
    return (
      <Card className="w-full h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prontuário do Paciente
          </CardTitle>
          <Badge variant="outline">Consulta Ativa</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Patient Info */}
            {patientData && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{patientData.display_name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{calculateAge(patientData.data_nascimento)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{patientData.telefone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{patientData.endereco || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Allergies */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Alergias
              </h4>
              <div className="flex flex-wrap gap-2">
                {medicalHistory.allergies.length > 0 ? (
                  medicalHistory.allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                      {allergy}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Nenhuma alergia registrada</span>
                )}
              </div>
            </div>

            <Separator />

            {/* Current Medications */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Pill className="h-4 w-4 text-blue-500" />
                Medicações Atuais
              </h4>
              <div className="space-y-2">
                {medicalHistory.medications.length > 0 ? (
                  medicalHistory.medications.map((medication, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{medication}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Nenhuma medicação registrada</span>
                )}
              </div>
            </div>

            <Separator />

            {/* Medical Conditions */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-green-500" />
                Condições Médicas
              </h4>
              <div className="flex flex-wrap gap-2">
                {medicalHistory.conditions.length > 0 ? (
                  medicalHistory.conditions.map((condition, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      {condition}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Nenhuma condição médica registrada</span>
                )}
              </div>
            </div>

            <Separator />

            {/* Recent Exams */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-purple-500" />
                Exames Recentes
              </h4>
              <div className="space-y-2">
                {medicalHistory.lastExams.length > 0 ? (
                  medicalHistory.lastExams.map((exam, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{exam.type}</p>
                        <p className="text-xs text-gray-500">{new Date(exam.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {exam.result}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Nenhum exame recente</span>
                )}
              </div>
            </div>

            <Separator />

            {/* Recent Consultations */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-orange-500" />
                Consultas Anteriores
              </h4>
              <div className="space-y-2">
                {medicalHistory.consultations.length > 0 ? (
                  medicalHistory.consultations.slice(0, 5).map((consultation, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {consultation.medico?.dados_profissionais?.nome || 'Médico'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(consultation.consultation_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {consultation.status}
                        </Badge>
                      </div>
                      {consultation.notes && (
                        <p className="text-sm text-gray-600 mt-2">{consultation.notes}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Primeira consulta do paciente</span>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};