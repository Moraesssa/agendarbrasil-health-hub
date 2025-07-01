
import { z } from "zod";

export const diasDaSemana = [
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
] as const;

export const horarioSchema = z.object({
  ativo: z.boolean(),
  inicio: z.string(),
  fim: z.string(),
  local_id: z.string().uuid().nullable(),
}).refine(data => {
    if (!data.ativo) return true;
    return !!data.local_id && !!data.inicio && !!data.fim && data.inicio < data.fim;
}, {
  message: "Para blocos ativos, o local é obrigatório e o início deve ser antes do fim.",
  path: ["local_id"],
});

export const agendaSchema = z.object({
  horarios: z.object(
    diasDaSemana.reduce((acc, dia) => {
      acc[dia.key] = z.array(horarioSchema);
      return acc;
    }, {} as Record<string, z.ZodTypeAny>)
  )
});

export type AgendaFormData = z.infer<typeof agendaSchema>;
