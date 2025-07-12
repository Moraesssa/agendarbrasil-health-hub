import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  MedicationReminder, 
  MedicationDose, 
  CreateMedicationData,
  MedicationWithDoses
} from '@/types/medication';

export const medicationService = {
  // Get user's medication reminders
  async getMedicationReminders(): Promise<MedicationWithDoses[]> {
    logger.info("Fetching medication reminders", "MedicationService");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error("Error fetching medication reminders", "MedicationService", error);
        throw new Error(`Erro ao buscar medicamentos: ${error.message}`);
      }

      // For each medication, get today's doses and next dose
      const medicationsWithDoses = await Promise.all(
        (data || []).map(async (medicationData: any) => {
          const medication: MedicationReminder = {
            ...medicationData,
            times: Array.isArray(medicationData.times) ? medicationData.times : []
          };
          const today = new Date().toISOString().split('T')[0];
          
          // Get today's doses
          const { data: todayDoses } = await supabase
            .from('medication_doses')
            .select('*')
            .eq('reminder_id', medication.id)
            .eq('scheduled_date', today)
            .order('scheduled_time');

          // Get next upcoming dose
          const { data: nextDoses } = await supabase
            .from('medication_doses')
            .select('*')
            .eq('reminder_id', medication.id)
            .gte('scheduled_date', today)
            .eq('status', 'pending')
            .order('scheduled_date', { ascending: true })
            .order('scheduled_time', { ascending: true })
            .limit(1);

          return {
            ...medication,
            todayDoses: (todayDoses || []).map((dose: any) => ({
              ...dose,
              status: dose.status as MedicationDose['status']
            })),
            nextDose: nextDoses?.[0] ? {
              ...nextDoses[0],
              status: nextDoses[0].status as MedicationDose['status']
            } : undefined
          };
        })
      );

      return medicationsWithDoses;
    } catch (error) {
      logger.error("Failed to fetch medication reminders", "MedicationService", error);
      throw error;
    }
  },

  // Create new medication reminder
  async createMedicationReminder(medicationData: CreateMedicationData): Promise<void> {
    logger.info("Creating medication reminder", "MedicationService", { medication: medicationData.medication_name });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create the medication reminder
      const { data: newReminder, error: reminderError } = await supabase
        .from('medication_reminders')
        .insert({
          ...medicationData,
          user_id: user.id,
          times: medicationData.times
        })
        .select()
        .single();

      if (reminderError) {
        logger.error("Error creating medication reminder", "MedicationService", reminderError);
        throw new Error(`Erro ao criar medicamento: ${reminderError.message}`);
      }

      // Generate doses for the next 30 days
      await this.generateDoses(newReminder.id, medicationData.times, medicationData.start_date);

      logger.info("Medication reminder created successfully", "MedicationService");
    } catch (error) {
      logger.error("Failed to create medication reminder", "MedicationService", error);
      throw error;
    }
  },

  // Generate doses for a medication
  async generateDoses(reminderId: string, times: string[], startDate: string): Promise<void> {
    const doses = [];
    const start = new Date(startDate);
    
    // Generate doses for the next 30 days
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      times.forEach(time => {
        doses.push({
          reminder_id: reminderId,
          scheduled_date: dateString,
          scheduled_time: time,
          status: 'pending'
        });
      });
    }

    const { error } = await supabase
      .from('medication_doses')
      .insert(doses);

    if (error) {
      logger.error("Error generating doses", "MedicationService", error);
      throw new Error(`Erro ao gerar doses: ${error.message}`);
    }
  },

  // Mark dose as taken
  async markDoseAsTaken(doseId: string, notes?: string): Promise<void> {
    logger.info("Marking dose as taken", "MedicationService", { doseId });
    try {
      const { error } = await supabase
        .from('medication_doses')
        .update({
          status: 'taken',
          taken_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', doseId);

      if (error) {
        logger.error("Error marking dose as taken", "MedicationService", error);
        throw new Error(`Erro ao marcar dose: ${error.message}`);
      }

      logger.info("Dose marked as taken successfully", "MedicationService");
    } catch (error) {
      logger.error("Failed to mark dose as taken", "MedicationService", error);
      throw error;
    }
  },

  // Get medication doses for a specific date
  async getDosesForDate(date: string): Promise<MedicationDose[]> {
    logger.info("Fetching doses for date", "MedicationService", { date });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('medication_doses')
        .select(`
          *,
          medication_reminders!inner(
            user_id,
            medication_name,
            dosage,
            is_active
          )
        `)
        .eq('scheduled_date', date)
        .eq('medication_reminders.user_id', user.id)
        .eq('medication_reminders.is_active', true)
        .order('scheduled_time');

      if (error) {
        logger.error("Error fetching doses for date", "MedicationService", error);
        throw new Error(`Erro ao buscar doses: ${error.message}`);
      }

      return (data || []).map((dose: any) => ({
        ...dose,
        status: dose.status as MedicationDose['status']
      }));
    } catch (error) {
      logger.error("Failed to fetch doses for date", "MedicationService", error);
      throw error;
    }
  },

  // Update medication reminder
  async updateMedicationReminder(id: string, updates: Partial<CreateMedicationData>): Promise<void> {
    logger.info("Updating medication reminder", "MedicationService", { id });
    try {
      const { error } = await supabase
        .from('medication_reminders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        logger.error("Error updating medication reminder", "MedicationService", error);
        throw new Error(`Erro ao atualizar medicamento: ${error.message}`);
      }

      // If times were updated, regenerate future doses
      if (updates.times) {
        // Delete future doses (from tomorrow onwards)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        await supabase
          .from('medication_doses')
          .delete()
          .eq('reminder_id', id)
          .gte('scheduled_date', tomorrowStr);

        // Generate new doses
        await this.generateDoses(id, updates.times, tomorrowStr);
      }

      logger.info("Medication reminder updated successfully", "MedicationService");
    } catch (error) {
      logger.error("Failed to update medication reminder", "MedicationService", error);
      throw error;
    }
  },

  // Delete medication reminder
  async deleteMedicationReminder(id: string): Promise<void> {
    logger.info("Deleting medication reminder", "MedicationService", { id });
    try {
      // Mark as inactive instead of deleting
      const { error } = await supabase
        .from('medication_reminders')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        logger.error("Error deleting medication reminder", "MedicationService", error);
        throw new Error(`Erro ao excluir medicamento: ${error.message}`);
      }

      logger.info("Medication reminder deleted successfully", "MedicationService");
    } catch (error) {
      logger.error("Failed to delete medication reminder", "MedicationService", error);
      throw error;
    }
  }
};
