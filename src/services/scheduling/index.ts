// Re-export from appointmentService for backward compatibility
import { appointmentService } from '../appointmentService';
export default appointmentService;
export type { Medico, LocalComHorarios } from '../agendamento/types';
export type { Medico as Doctor } from '../agendamento/types';
