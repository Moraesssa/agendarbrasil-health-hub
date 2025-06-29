// Dentro de src/services/appointmentService.ts

// ... (código existente acima)

  async getDoctorsBySpecialty(specialty: string, state: string, city: string): Promise<Medico[]> {
    logger.info("Buscando médicos por especialidade e local", "AppointmentService", { specialty, state, city });
    try {
      await checkAuthentication();
      if (!specialty || !state || !city) {
        // Retorna array vazio se algum filtro essencial estiver em falta, em vez de dar erro
        return [];
      }

      // **CORREÇÃO: Adicionados filtros para estado (uf) e cidade no JSON de endereço**
      const { data, error } = await supabase
        .from('medicos')
        .select(`
          user_id,
          profiles(display_name)
        `)
        .contains('especialidades', [specialty])
        .eq('endereco->>uf', state)
        .eq('endereco->>cidade', city);

      if (error) {
        throw new Error(`Erro ao buscar médicos: ${error.message}`);
      }
      
      return (data || []).map((d: any) => ({
        id: d.user_id,
        display_name: d.profiles?.display_name || "Médico sem nome"
      }));
    } catch (error) {
      logger.error("Falha ao buscar médicos", "AppointmentService", { specialty, state, city, error });
      throw error;
    }
  },

// ... (resto do código do ficheiro)