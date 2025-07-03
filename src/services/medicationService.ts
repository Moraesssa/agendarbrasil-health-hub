import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface MedicationReminder {
  id: string;
  user_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  times: string[];
  start_date: string;
  end_date?: string | null;
  instructions?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationDose {
  id: string;
  reminder_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  taken_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationWithDoses extends MedicationReminder {
  today_doses?: MedicationDose[];
  next_dose_time?: string;
  status?: 'pending' | 'taken' | 'missed' | 'overdue';
}

class MedicationService {
  private convertJsonToStringArray(jsonValue: any): string[] {
    if (Array.isArray(jsonValue)) {
      return jsonValue.filter(item => typeof item === 'string') as string[];
    }
    return [];
  }

  private sanitizeMedicationData(medication: any) {
    return {
      ...medication,
      // Ensure end_date is null if empty string
      end_date: medication.end_date && medication.end_date.trim() !== '' ? medication.end_date : null,
      // Ensure instructions is null if empty string
      instructions: medication.instructions && medication.instructions.trim() !== '' ? medication.instructions : null,
      // Ensure times is properly formatted
      times: Array.isArray(medication.times) ? medication.times : []
    };
  }

  async getMedicationReminders(): Promise<MedicationWithDoses[]> {
    try {
      const { data: reminders, error } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get today's doses for each reminder
      const today = new Date().toISOString().split('T')[0];
      const remindersWithDoses = await Promise.all(
        (reminders || []).map(async (reminder) => {
          const { data: doses } = await supabase
            .from('medication_doses')
            .select('*')
            .eq('reminder_id', reminder.id)
            .eq('scheduled_date', today)
            .order('scheduled_time');

          // Convert Json type to string[] for times
          const times = this.convertJsonToStringArray(reminder.times);
          
          // Convert doses to proper type
          const typedDoses: MedicationDose[] = (doses || []).map(dose => ({
            ...dose,
            status: dose.status as 'pending' | 'taken' | 'missed' | 'skipped'
          }));

          return {
            ...reminder,
            times: times,
            today_doses: typedDoses,
            next_dose_time: this.getNextDoseTime(times, typedDoses),
            status: this.getMedicationStatus(times, typedDoses)
          } as MedicationWithDoses;
        })
      );

      return remindersWithDoses;
    } catch (error) {
      logger.error("Erro ao buscar lembretes de medicamento", "medicationService", error);
      throw error;
    }
  }

  async createMedicationReminder(medication: Omit<MedicationReminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<MedicationReminder> {
    try {
      // Sanitize data before sending to database
      const sanitizedMedication = this.sanitizeMedicationData(medication);
      
      const { data, error } = await supabase
        .from('medication_reminders')
        .insert({
          ...sanitizedMedication,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial doses for today and upcoming days
      const reminderWithTimes = { ...data, times: this.convertJsonToStringArray(data.times) };
      await this.generateDosesForReminder(reminderWithTimes);

      return { ...data, times: this.convertJsonToStringArray(data.times) };
    } catch (error) {
      logger.error("Erro ao criar lembrete de medicamento", "medicationService", error);
      throw error;
    }
  }

  async updateMedicationReminder(id: string, updates: Partial<MedicationReminder>): Promise<MedicationReminder> {
    try {
      // Sanitize data before sending to database
      const sanitizedUpdates = this.sanitizeMedicationData(updates);
      
      const { data, error } = await supabase
        .from('medication_reminders')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, times: this.convertJsonToStringArray(data.times) };
    } catch (error) {
      logger.error("Erro ao atualizar lembrete de medicamento", "medicationService", error);
      throw error;
    }
  }

  async deleteMedicationReminder(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('medication_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      logger.error("Erro ao deletar lembrete de medicamento", "medicationService", error);
      throw error;
    }
  }

  async markDoseAsTaken(doseId: string, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('medication_doses')
        .update({
          status: 'taken',
          taken_at: new Date().toISOString(),
          notes: notes
        })
        .eq('id', doseId);

      if (error) throw error;
    } catch (error) {
      logger.error("Erro ao marcar dose como tomada", "medicationService", error);
      throw error;
    }
  }

  async markDoseAsSkipped(doseId: string, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('medication_doses')
        .update({
          status: 'skipped',
          notes: notes
        })
        .eq('id', doseId);

      if (error) throw error;
    } catch (error) {
      logger.error("Erro ao marcar dose como pulada", "medicationService", error);
      throw error;
    }
  }

  private async generateDosesForReminder(reminder: MedicationReminder): Promise<void> {
    const startDate = new Date(reminder.start_date);
    const endDate = reminder.end_date ? new Date(reminder.end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    const doses = [];
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      for (const time of reminder.times) {
        doses.push({
          reminder_id: reminder.id,
          scheduled_date: date.toISOString().split('T')[0],
          scheduled_time: time,
          status: 'pending'
        });
      }
    }

    if (doses.length > 0) {
      const { error } = await supabase
        .from('medication_doses')
        .insert(doses);

      if (error) {
        logger.error("Erro ao gerar doses para lembrete", "medicationService", error);
      }
    }
  }

  private getNextDoseTime(times: string[], doses: MedicationDose[]): string {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    
    // Find next scheduled time today
    const upcomingTimes = times.filter(time => time > currentTime);
    
    if (upcomingTimes.length > 0) {
      return upcomingTimes[0];
    }
    
    // If no more times today, return first time tomorrow
    return times[0] || '';
  }

  private getMedicationStatus(times: string[], doses: MedicationDose[]): 'pending' | 'taken' | 'missed' | 'overdue' {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    
    // Check if any dose is overdue (more than 1 hour past scheduled time)
    const overdueDoses = doses.filter(dose => {
      const doseTime = dose.scheduled_time;
      const scheduledDateTime = new Date(`1970-01-01T${doseTime}:00`);
      const currentDateTime = new Date(`1970-01-01T${currentTime}:00`);
      const diffMinutes = (currentDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60);
      
      return dose.status === 'pending' && diffMinutes > 60;
    });

    if (overdueDoses.length > 0) return 'overdue';

    // Check if all today's doses are taken
    const takenDoses = doses.filter(dose => dose.status === 'taken');
    if (takenDoses.length === times.length) return 'taken';

    return 'pending';
  }
}

export const medicationService = new MedicationService();
