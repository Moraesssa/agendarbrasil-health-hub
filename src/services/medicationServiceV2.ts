
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { MedicationReminder, MedicationDose, MedicationWithDoses } from "@/types/medication";

class MedicationServiceV2 {
  private toLocaleDateString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private convertJsonToStringArray(jsonValue: any): string[] {
    if (Array.isArray(jsonValue)) {
      return jsonValue.filter(item => typeof item === 'string') as string[];
    }
    return [];
  }

  async getMedicationReminders(): Promise<MedicationWithDoses[]> {
    try {
      const { data: reminders, error } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const today = this.toLocaleDateString(new Date());
      logger.debug("Buscando medicamentos e doses para hoje", "getMedicationReminders", { today });

      const remindersWithDoses = await Promise.all(
        (reminders || []).map(async (reminder) => {
          // Buscar doses de hoje
          const { data: doses, error: dosesError } = await supabase
            .from('medication_doses')
            .select('*')
            .eq('reminder_id', reminder.id)
            .eq('scheduled_date', today)
            .order('scheduled_time');

          if (dosesError) {
            logger.error("Erro ao buscar doses", "getMedicationReminders", dosesError);
          }

          const times = this.convertJsonToStringArray(reminder.times);
          const typedDoses: MedicationDose[] = (doses || []).map(dose => ({
            ...dose,
            status: dose.status as 'pending' | 'taken' | 'missed' | 'skipped'
          }));

          // Se não há doses para hoje, gerar
          if (typedDoses.length === 0 && times.length > 0) {
            logger.debug("Gerando doses para hoje", "getMedicationReminders", {
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
              today_doses: newTypedDoses
            } as MedicationWithDoses;
          }

          return {
            ...reminder,
            times: times,
            today_doses: typedDoses
          } as MedicationWithDoses;
        })
      );

      logger.debug("Medicamentos carregados com sucesso", "getMedicationReminders", {
        count: remindersWithDoses.length
      });

      return remindersWithDoses;
    } catch (error) {
      logger.error("Erro ao buscar lembretes de medicamento", "medicationServiceV2", error);
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
      
      logger.debug("Dose marcada como tomada", "markDoseAsTaken", { doseId });
    } catch (error) {
      logger.error("Erro ao marcar dose como tomada", "medicationServiceV2", error);
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
      
      logger.debug("Dose marcada como pulada", "markDoseAsSkipped", { doseId });
    } catch (error) {
      logger.error("Erro ao marcar dose como pulada", "medicationServiceV2", error);
      throw error;
    }
  }

  async createMedicationReminder(medication: Omit<MedicationReminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<MedicationReminder> {
    try {
      const sanitizedMedication = {
        ...medication,
        end_date: medication.end_date && medication.end_date.trim() !== '' ? medication.end_date : null,
        instructions: medication.instructions && medication.instructions.trim() !== '' ? medication.instructions : null,
        times: Array.isArray(medication.times) ? medication.times : []
      };
      
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

      // Gerar doses para hoje
      const reminderWithTimes = { ...data, times: this.convertJsonToStringArray(data.times) };
      await this.generateTodayDoses(reminderWithTimes.id, reminderWithTimes.times);

      return { ...data, times: this.convertJsonToStringArray(data.times) };
    } catch (error) {
      logger.error("Erro ao criar lembrete de medicamento", "medicationServiceV2", error);
      throw error;
    }
  }

  async updateMedicationReminder(id: string, updates: Partial<MedicationReminder>): Promise<MedicationReminder> {
    try {
      const sanitizedUpdates = {
        ...updates,
        end_date: updates.end_date && updates.end_date.trim() !== '' ? updates.end_date : null,
        instructions: updates.instructions && updates.instructions.trim() !== '' ? updates.instructions : null,
        times: Array.isArray(updates.times) ? updates.times : undefined
      };
      
      const { data, error } = await supabase
        .from('medication_reminders')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, times: this.convertJsonToStringArray(data.times) };
    } catch (error) {
      logger.error("Erro ao atualizar lembrete de medicamento", "medicationServiceV2", error);
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
      logger.error("Erro ao deletar lembrete de medicamento", "medicationServiceV2", error);
      throw error;
    }
  }
}

export const medicationServiceV2 = new MedicationServiceV2();
