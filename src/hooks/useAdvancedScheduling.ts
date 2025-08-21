import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { appointmentServiceProxy } from '@/services/mockAppointmentService';
import { generateTimeSlots, TimeSlot, DoctorConfig, ExistingAppointment } from '@/utils/timeSlotUtils';

interface ReservationData {
  doctorId: string;
  dateTime: string;
  sessionId: string;
  expiresAt: Date;
}

interface SchedulingFilters {
  specialty?: string;
  location?: string;
  availability?: 'morning' | 'afternoon' | 'evening';
  insurance?: string;
  rating?: number;
}

interface DoctorWithAvailability {
  id: string;
  display_name: string;
  especialidades: string[];
  rating?: number;
  nextAvailableSlot?: string;
  totalSlots: number;
  locais: Array<{
    id: string;
    nome_local: string;
    endereco: any;
    slots: TimeSlot[];
  }>;
}

export const useAdvancedScheduling = () => {
  const [temporaryReservation, setTemporaryReservation] = useState<ReservationData | null>(null);
  const [reservationTimer, setReservationTimer] = useState<NodeJS.Timeout | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<SchedulingFilters[]>([]);

  // Load favorites and recent searches from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('doctor-favorites');
    const savedSearches = localStorage.getItem('recent-searches');
    
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (reservationTimer) {
        clearTimeout(reservationTimer);
      }
    };
  }, [reservationTimer]);

  const createTemporaryReservation = useCallback(async (
    doctorId: string,
    dateTime: string,
    localId?: string
  ): Promise<boolean> => {
    if (isReserving) return false;
    
    setIsReserving(true);
    
    try {
      const result = await appointmentServiceProxy.createTemporaryReservation(doctorId, dateTime, localId);

      if (!result) {
        // Errors are handled inside the service, just need to stop execution here
        return false;
      }

      const reservationData: ReservationData = {
        doctorId,
        dateTime,
        sessionId: result.sessionId,
        expiresAt: result.expiresAt
      };

      setTemporaryReservation(reservationData);

      // Set cleanup timer
      const timer = setTimeout(() => {
        cleanupTemporaryReservation(sessionId);
      }, 15 * 60 * 1000);

      setReservationTimer(timer);

      toast({
        title: "Horário reservado temporariamente",
        description: "Você tem 15 minutos para confirmar o agendamento.",
      });

      return true;
    } catch (error) {
      console.error('Error creating temporary reservation:', error);
      toast({
        title: "Erro na reserva",
        description: "Não foi possível reservar o horário. Tente novamente.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsReserving(false);
    }
  }, [isReserving]);

  const cleanupTemporaryReservation = useCallback(async (sessionId?: string) => {
    const targetSessionId = sessionId || temporaryReservation?.sessionId;
    
    if (!targetSessionId) return;

    try {
      await supabase
        .from('temporary_reservations')
        .delete()
        .eq('session_id', targetSessionId);

      setTemporaryReservation(null);
      
      if (reservationTimer) {
        clearTimeout(reservationTimer);
        setReservationTimer(null);
      }
    } catch (error) {
      console.error('Error cleaning up temporary reservation:', error);
    }
  }, [temporaryReservation, reservationTimer]);

  const extendReservation = useCallback(async (): Promise<boolean> => {
    if (!temporaryReservation) return false;

    try {
      const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      const { error } = await supabase
        .from('temporary_reservations')
        .update({ expires_at: newExpiresAt.toISOString() })
        .eq('session_id', temporaryReservation.sessionId);

      if (error) throw error;

      setTemporaryReservation(prev => prev ? { ...prev, expiresAt: newExpiresAt } : null);

      // Reset timer
      if (reservationTimer) {
        clearTimeout(reservationTimer);
      }
      
      const timer = setTimeout(() => {
        cleanupTemporaryReservation();
      }, 15 * 60 * 1000);

      setReservationTimer(timer);

      toast({
        title: "Reserva estendida",
        description: "Você tem mais 15 minutos para confirmar o agendamento.",
      });

      return true;
    } catch (error) {
      console.error('Error extending reservation:', error);
      toast({
        title: "Erro ao estender reserva",
        description: "Não foi possível estender a reserva. Complete o agendamento rapidamente.",
        variant: "destructive"
      });
      return false;
    }
  }, [temporaryReservation, reservationTimer, cleanupTemporaryReservation]);

  const generateAdvancedTimeSlots = useCallback(async (
    doctorId: string,
    selectedDate: string,
    excludeReserved: boolean = true
  ): Promise<TimeSlot[]> => {
    try {
      // Get doctor configuration
      const { data: medicoData, error: medicoError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', doctorId)
        .single();

      if (medicoError) throw medicoError;

      const config = medicoData?.configuracoes as DoctorConfig;
      
      // Get existing appointments
      const startOfDay = new Date(`${selectedDate}T00:00:00.000Z`);
      const endOfDay = new Date(`${selectedDate}T23:59:59.999Z`);
      
      const { data: appointments, error: appointmentsError } = await supabase
        .from('consultas')
        .select('consultation_date')
        .eq('medico_id', doctorId)
        .gte('consultation_date', startOfDay.toISOString())
        .lte('consultation_date', endOfDay.toISOString())
        .in('status', ['agendada', 'confirmada']);

      if (appointmentsError) throw appointmentsError;

      const existingAppointments: ExistingAppointment[] = (appointments || []).map(apt => ({
        data_consulta: apt.consultation_date,
        duracao_minutos: config?.duracaoConsulta || 30
      }));

      // Get temporary reservations if excluding them
      let reservedSlots: string[] = [];
      if (excludeReserved) {
        const { data: reservations } = await supabase
          .from('temporary_reservations')
          .select('data_consulta')
          .eq('medico_id', doctorId)
          .gte('expires_at', new Date().toISOString())
          .gte('data_consulta', startOfDay.toISOString())
          .lte('data_consulta', endOfDay.toISOString());

        reservedSlots = (reservations || []).map(res => 
          new Date(res.data_consulta).toTimeString().substring(0, 5)
        );
      }

      // Generate time slots
      const slots = generateTimeSlots(config, new Date(selectedDate), existingAppointments);

      // Filter out temporarily reserved slots
      return slots.map(slot => ({
        ...slot,
        available: slot.available && !reservedSlots.includes(slot.time)
      }));
    } catch (error) {
      console.error('Error generating advanced time slots:', error);
      throw error;
    }
  }, []);

  const searchDoctorsWithAvailability = useCallback(async (
    filters: SchedulingFilters,
    selectedDate: string
  ): Promise<DoctorWithAvailability[]> => {
    try {
      // Search doctors based on filters
      let query = supabase
        .from('medicos')
        .select(`
          user_id,
          display_name:profiles!medicos_user_id_fkey(full_name),
          especialidades,
          configuracoes,
          locais_atendimento!medicos_user_id_fkey(*)
        `)
        .eq('locais_atendimento.ativo', true);

      if (filters.specialty) {
        query = query.contains('especialidades', [filters.specialty]);
      }

      const { data: doctors, error } = await query;
      if (error) throw error;

      // Get availability for each doctor
      const doctorsWithAvailability: DoctorWithAvailability[] = [];
      
      for (const doctor of (doctors as any[]) || []) {
        try {
          const slots = await generateAdvancedTimeSlots(doctor.user_id, selectedDate);
          const availableSlots = slots.filter(slot => slot.available);
          
          if (availableSlots.length > 0) {
            // Group slots by location
            const locais = doctor.locais_atendimento.map((local: any) => ({
              id: local.id,
              nome_local: local.nome_local,
              endereco: local.endereco,
              slots: availableSlots // For simplicity, showing all slots for each location
            }));

            doctorsWithAvailability.push({
              id: doctor.user_id,
              display_name: (doctor as any).display_name || 'Dr. Médico',
              especialidades: doctor.especialidades || [],
              nextAvailableSlot: availableSlots[0]?.time,
              totalSlots: availableSlots.length,
              locais
            });
          }
        } catch (error) {
          console.error(`Error getting availability for doctor ${doctor.user_id}:`, error);
        }
      }

      // Sort by availability and other criteria
      doctorsWithAvailability.sort((a, b) => {
        // Prioritize doctors with more availability
        return b.totalSlots - a.totalSlots;
      });

      return doctorsWithAvailability;
    } catch (error) {
      console.error('Error searching doctors with availability:', error);
      throw error;
    }
  }, [generateAdvancedTimeSlots]);

  const toggleFavorite = useCallback((doctorId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(doctorId)
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId];
      
      localStorage.setItem('doctor-favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const saveSearch = useCallback((filters: SchedulingFilters) => {
    setRecentSearches(prev => {
      const newSearches = [filters, ...prev.filter(s => 
        JSON.stringify(s) !== JSON.stringify(filters)
      )].slice(0, 5);
      
      localStorage.setItem('recent-searches', JSON.stringify(newSearches));
      return newSearches;
    });
  }, []);

  const getReservationTimeRemaining = useCallback((): number => {
    if (!temporaryReservation) return 0;
    
    const now = new Date().getTime();
    const expiresAt = temporaryReservation.expiresAt.getTime();
    
    return Math.max(0, expiresAt - now);
  }, [temporaryReservation]);

  return {
    // Temporary reservation management
    temporaryReservation,
    createTemporaryReservation,
    cleanupTemporaryReservation,
    extendReservation,
    getReservationTimeRemaining,
    isReserving,
    
    // Advanced slot generation
    generateAdvancedTimeSlots,
    
    // Smart search
    searchDoctorsWithAvailability,
    
    // Favorites and history
    favorites,
    toggleFavorite,
    recentSearches,
    saveSearch
  };
};