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

  private toLocaleDateString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      const today = this.toLocaleDateString(new Date());
      logger.debug("Buscando doses para hoje", "getMedicationReminders", { today });

      const remindersWithDoses = await Promise.all(
        (reminders || []).map(async (reminder) => {
          const { data: doses, error: dosesError } = await supabase
            .from('medication_doses')
            .select('*')
            .eq('reminder_id', reminder.id)
            .eq('scheduled_date', today)
            .order('scheduled_time');

          if (dosesError) {
            logger.error("Erro ao buscar doses", "getMedicationReminders", dosesError);
          }

          // Convert Json type to string[] for times
          const times = this.convertJsonToStringArray(reminder.times);
          
          // Convert doses to proper type
          const typedDoses: MedicationDose[] = (doses || []).map(dose => ({
            ...dose,
            status: dose.status as 'pending' | 'taken' | 'missed' | 'skipped'
          }));

          logger.debug("Doses encontradas para lembrete", "getMedicationReminders", {
            reminderId: reminder.id,
            medicationName: reminder.medication_name,
            dosesCount: typedDoses.length,
            times: times,
            doses: typedDoses
          });

          // Se não há doses para hoje mas o lembrete está ativo, gerar doses
          if (typedDoses.length === 0 && times.length > 0) {
            logger.debug("Gerando doses ausentes para hoje", "getMedicationReminders", {
              reminderId: reminder.id,
              times: times
            });
            
            await this.generateTodayDoses(reminder.id, times);
            
            // Buscar as doses recém-criadas
            const { data: newDoses } = await supabase
              .from('medication_doses')
              .select('*')
              .eq('reminder_id', reminder.id)
              .eq('scheduled_date', today)
              .order('scheduled_time');

            const newTypedDoses: MedicationDose[] = (newDoses || []).map(dose => ({
              ...dose,
              status: dose.status as 'pending' | 'taken' | 'missed' | 'skipped'
            }));

            return {
              ...reminder,
              times: times,
              today_doses: newTypedDoses,
              next_dose_time: this.getNextDoseTime(times, newTypedDoses),
              status: this.getMedicationStatus(times, newTypedDoses)
            } as MedicationWithDoses;
          }

          return {
            ...reminder,
            times: times,
            today_doses: typedDoses,
            next_dose_time: this.getNextDoseTime(times, typedDoses),
            status: this.getMedicationStatus(times, typedDoses)
          } as MedicationWithDoses;
        })
      );

      logger.debug("Lembretes carregados com sucesso", "getMedicationReminders", {
        count: remindersWithDoses.length,
        reminders: remindersWithDoses.map(r => ({
          id: r.id,
          name: r.medication_name,
          dosesCount: r.today_doses?.length || 0
        }))
      });

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
      
      logger.debug("Criando lembrete de medicamento", "createMedicationReminder", {
        medication_name: sanitizedMedication.medication_name,
        times: sanitizedMedication.times
      });
      
      const { data, error } = await supabase
        .from('medication_reminders')
        .insert({
          ...sanitizedMedication,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      logger.debug("Lembrete criado, gerando doses", "createMedicationReminder", {
        reminderId: data.id,
        times: this.convertJsonToStringArray(data.times)
      });

      // Create initial doses for today and upcoming days
      const reminderWithTimes = { ...data, times: this.convertJsonToStringArray(data.times) };
      await this.generateDosesForReminder(reminderWithTimes);

      // Verificar se as doses foram criadas corretamente
      const today = this.toLocaleDateString(new Date());
      const { data: todayDoses } = await supabase
        .from('medication_doses')
        .select('*')
        .eq('reminder_id', data.id)
        .eq('scheduled_date', today);

      logger.debug("Doses criadas para hoje", "createMedicationReminder", {
        reminderId: data.id,
        dosesCreated: todayDoses?.length || 0,
        expectedDoses: reminderWithTimes.times.length
      });

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

  private async generateTodayDoses(reminderId: string, times: string[]): Promise<void> {
    const today = this.toLocaleDateString(new Date());
    
    const doses = times.map(time => ({
      reminder_id: reminderId,
      scheduled_date: today,
      scheduled_time: time,
      status: 'pending'
    }));

    logger.debug("Criando doses para hoje", "generateTodayDoses", {
      reminderId,
      dosesCount: doses.length,
      doses
    });

    if (doses.length > 0) {
      const { error } = await supabase
        .from('medication_doses')
        .insert(doses);

      if (error) {
        logger.error("Erro ao gerar doses para hoje", "generateTodayDoses", error);
        throw error;
      }

      logger.debug("Doses criadas com sucesso para hoje", "generateTodayDoses", {
        reminderId,
        dosesCreated: doses.length
      });
    }
  }

  private async generateDosesForReminder(reminder: MedicationReminder): Promise<void> {
    try {
      const startDate = new Date(reminder.start_date);
      const endDate = reminder.end_date ? new Date(reminder.end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      logger.debug("Gerando doses para lembrete", "generateDosesForReminder", {
        reminderId: reminder.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        times: reminder.times
      });
      
      const doses = [];
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        for (const time of reminder.times) {
          doses.push({
            reminder_id: reminder.id,
            scheduled_date: this.toLocaleDateString(date),
            scheduled_time: time,
            status: 'pending'
          });
        }
      }

      logger.debug("Doses preparadas para inserção", "generateDosesForReminder", {
        reminderId: reminder.id,
        totalDoses: doses.length,
        daysSpan: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        timesPerDay: reminder.times.length
      });

      if (doses.length > 0) {
        const { error } = await supabase
          .from('medication_doses')
          .insert(doses);

        if (error) {
          logger.error("Erro ao gerar doses para lembrete", "generateDosesForReminder", {
            error,
            reminderId: reminder.id,
            dosesCount: doses.length
          });
          throw error;
        }

        logger.debug("Doses geradas com sucesso", "generateDosesForReminder", {
          reminderId: reminder.id,
          dosesCreated: doses.length
        });
      }
    } catch (error) {
      logger.error("Erro na geração de doses", "generateDosesForReminder", {
        error,
        reminderId: reminder.id
      });
      throw error;
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
