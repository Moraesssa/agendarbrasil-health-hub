
import { Calendar, Pill, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface DayActionDropdownProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMedication: () => void;
  selectedDate: Date | null;
}

export const DayActionDropdown = ({ 
  isOpen, 
  onOpenChange, 
  onAddMedication,
  selectedDate 
}: DayActionDropdownProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleScheduleAppointment = () => {
    toast({
      title: "Agendando consulta",
      description: `Redirecionando para agendamento...`
    });
    navigate('/agendamento');
    onOpenChange(false);
  };

  const handleAddMedication = () => {
    onAddMedication();
    onOpenChange(false);
  };

  if (!selectedDate) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="invisible absolute"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="center" 
        className="w-56 bg-white border shadow-lg z-50"
      >
        <DropdownMenuItem 
          onClick={handleScheduleAppointment}
          className="cursor-pointer hover:bg-blue-50"
        >
          <Calendar className="h-4 w-4 mr-3 text-blue-600" />
          <span>Marcar Consulta</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleAddMedication}
          className="cursor-pointer hover:bg-green-50"
        >
          <Pill className="h-4 w-4 mr-3 text-green-600" />
          <span>Adicionar Medicamento</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
