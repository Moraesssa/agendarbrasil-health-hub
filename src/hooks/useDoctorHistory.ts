import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HistoryType = "all" | "consultas" | "exames";

export interface HistoryFilters {
  type: HistoryType;
  status?: string; // applies to both, when applicable
  patientQuery?: string; // text search on patient name
  startDate?: Date; // period start
}

export interface ConsultaRecord {
  id: string;
  consultation_date: string | null;
  consultation_type: string | null;
  status: string | null;
  notes: string | null;
  patient_name: string;
  paciente_id: string | null;
  medico_id: string | null;
}

export interface ExamRecord {
  id: string;
  exam_name: string;
  status: string;
  results_summary: string | null;
  results_available: boolean | null;
  scheduled_date: string | null;
  completed_date: string | null;
  patient_id: string;
  created_by: string;
  healthcare_provider: string | null;
}

export const useDoctorHistory = (doctorId?: string) => {
  const [consultas, setConsultas] = useState<ConsultaRecord[]>([]);
  const [exames, setExames] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!doctorId) return;
    setLoading(true);
    setError(null);
    try {
      const [consultasRes, examesRes] = await Promise.all([
        supabase
          .from("consultas")
          .select(
            "id, consultation_date, consultation_type, status, notes, patient_name, paciente_id, medico_id"
          )
          .eq("medico_id", doctorId)
          .order("consultation_date", { ascending: false }),
        supabase
          .from("medical_exams")
          .select(
            "id, exam_name, status, results_summary, results_available, scheduled_date, completed_date, patient_id, created_by, healthcare_provider"
          )
          .eq("created_by", doctorId)
          .order("scheduled_date", { ascending: false }),
      ]);

      if (consultasRes.error) throw consultasRes.error;
      if (examesRes.error) throw examesRes.error;

      setConsultas((consultasRes.data as any) || []);
      setExames((examesRes.data as any) || []);
    } catch (e: any) {
      console.error("Erro ao carregar histórico:", e);
      setError(e.message || "Falha ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  return { consultas, exames, loading, error, refetch: fetchData };
};
