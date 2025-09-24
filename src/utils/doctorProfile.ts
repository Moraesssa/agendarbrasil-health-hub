import {
  BaseUser,
  DoctorProfileDetails,
  DoctorProfessionalData,
  DoctorScheduleDay,
  DoctorScheduleSettings,
  DoctorVerificationStatus,
  Endereco,
} from '@/types/user';

const isRecord = (value: unknown): value is Record<string, any> => {
  return typeof value === 'object' && value !== null;
};

const parseJsonField = <T>(value: unknown): T | null => {
  if (!value) return null;
  if (isRecord(value) || Array.isArray(value)) {
    return value as T;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Erro ao converter campo JSON do médico', { value, error });
    }
  }

  return null;
};

const normalizeSpecialties = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }

  return [];
};

const normalizeScheduleSettings = (settings: DoctorScheduleSettings | null): DoctorScheduleSettings | null => {
  if (!settings) return null;

  const horarioAtendimentoRaw = settings.horarioAtendimento;

  if (!horarioAtendimentoRaw || typeof horarioAtendimentoRaw !== 'object') {
    return { ...settings, horarioAtendimento: undefined };
  }

  const horarioAtendimentoEntries = Object.entries(horarioAtendimentoRaw as Record<string, unknown>).reduce(
    (acc, [day, value]) => {
      if (!isRecord(value)) {
        return acc;
      }

      const dayConfig: DoctorScheduleDay = {
        ativo: typeof value.ativo === 'boolean' ? value.ativo : Boolean(value.ativo),
        inicio: typeof value.inicio === 'string' ? value.inicio : null,
        fim: typeof value.fim === 'string' ? value.fim : null,
      };

      if (typeof value.intervalo === 'string') {
        dayConfig.intervalo = value.intervalo;
      }

      if (Array.isArray(value.pausas)) {
        dayConfig.pausas = value.pausas
          .map((pause) =>
            isRecord(pause)
              ? {
                  inicio: typeof pause.inicio === 'string' ? pause.inicio : null,
                  fim: typeof pause.fim === 'string' ? pause.fim : null,
                }
              : null
          )
          .filter((pause): pause is { inicio?: string | null; fim?: string | null } => pause !== null);
      }

      acc[day] = dayConfig;
      return acc;
    },
    {} as Record<string, DoctorScheduleDay>
  );

  return {
    ...settings,
    horarioAtendimento:
      Object.keys(horarioAtendimentoEntries).length > 0 ? horarioAtendimentoEntries : undefined,
  };
};

export const mapMedicoDataToUser = (medicoData: any): Partial<BaseUser> => {
  if (!medicoData) return {};

  const dadosProfissionais = parseJsonField<DoctorProfessionalData>(medicoData.dados_profissionais);
  const configuracoes = normalizeScheduleSettings(
    parseJsonField<DoctorScheduleSettings>(medicoData.configuracoes)
  );
  const verificacao = parseJsonField<DoctorVerificationStatus>(medicoData.verificacao);
  const endereco = parseJsonField<Endereco>(medicoData.endereco);

  const telefone =
    typeof medicoData.telefone === 'string' && medicoData.telefone.trim().length > 0
      ? medicoData.telefone.trim()
      : null;
  const whatsapp =
    typeof medicoData.whatsapp === 'string' && medicoData.whatsapp.trim().length > 0
      ? medicoData.whatsapp.trim()
      : null;

  const details: DoctorProfileDetails = {
    telefone,
    whatsapp,
    dadosProfissionais: dadosProfissionais ?? null,
    configuracoes: configuracoes ?? null,
    verificacao: verificacao ?? null,
    endereco: endereco ?? null,
  };

  return {
    crm: typeof medicoData.crm === 'string' ? medicoData.crm : undefined,
    especialidades: normalizeSpecialties(medicoData.especialidades),
    ...details,
  };
};

