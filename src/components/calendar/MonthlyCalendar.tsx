
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMonthlyCalendar } from '@/hooks/useMonthlyCalendar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { DayActionDropdown } from './DayActionDropdown';
import { AddMedicationDialog } from '@/components/medication/AddMedicationDialog';
import { useMedicationManagement } from '@/hooks/useMedicationManagement';

const MonthlyCalendar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddMedication, setShowAddMedication] = useState(false);
  
  const { 
    loading, 
    error, 
    calendarDays, 
    navigateMonth, 
    goToToday, 
    getMonthYear,
    refetch 
  } = useMonthlyCalendar();

  const {
    createMedication,
    isSubmitting: medicationSubmitting
  } = useMedicationManagement();

  const handleDayClick = (day: any) => {
    if (!day.isCurrentMonth) return;

    if (day.hasConsultation) {
      const consultationEvent = day.events.find((event: any) => event.type === 'consultation');
      if (consultationEvent) {
        toast({
          title: 'Consulta Agendada',
          description: `${consultationEvent.title} às ${consultationEvent.time} com ${consultationEvent.description}`
        });
        navigate('/agenda-paciente');
      }
    } else if (day.hasMedication) {
      const medicationEvent = day.events.find((event: any) => event.type === 'medication');
      if (medicationEvent) {
        toast({
          title: 'Lembrete de Medicamento',
          description: medicationEvent.description
        });
        navigate('/gestao-medicamentos');
      }
    } else {
      // Dia vazio - mostrar dropdown
      setSelectedDate(day.date);
      setDropdownOpen(true);
    }
  };

  const handleAddMedication = () => {
    setShowAddMedication(true);
  };

  const handleRetry = () => {
    refetch();
  };

  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-red-600 text-lg sm:text-xl">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Erro na Agenda do Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRetry} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              Agenda do Mês
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/agenda-paciente")}
              className="text-blue-600 hover:text-blue-700"
              title="Ver agenda completa"
            >
              Ver detalhes
            </Button>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              disabled={loading}
              className="p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {getMonthYear()}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                disabled={loading}
                className="text-xs"
              >
                Hoje
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={loading}
              className="p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Carregando agenda...</span>
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs sm:text-sm relative">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="p-1 sm:p-2 font-medium text-gray-600 text-xs sm:text-sm">
                    {day}
                  </div>
                ))}
                
                {calendarDays.map((day, index) => {
                  const hasEvents = day.hasConsultation || day.hasMedication;
                  
                  return (
                    <div
                      key={index}
                      className={`p-1 sm:p-2 rounded-lg cursor-pointer transition-all hover:bg-blue-100 text-xs sm:text-sm min-h-[32px] sm:min-h-[36px] flex items-center justify-center relative ${
                        !day.isCurrentMonth 
                          ? 'text-gray-300' 
                          : day.hasConsultation 
                            ? 'bg-blue-500 text-white font-medium shadow-md hover:bg-blue-600' 
                            : day.hasMedication
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'hover:bg-gray-100 hover:border hover:border-blue-300'
                      }`}
                      onClick={() => handleDayClick(day)}
                      title={
                        day.hasConsultation 
                          ? `Consulta agendada para o dia ${day.dayNumber} - Clique para ver detalhes` 
                          : day.hasMedication 
                            ? `Lembrete de medicamento para o dia ${day.dayNumber}`
                            : day.isCurrentMonth 
                              ? 'Clique para agendar consulta ou adicionar medicamento'
                              : ''
                      }
                    >
                      {day.isCurrentMonth ? day.dayNumber : ''}
                      
                      {/* Multiple events indicator */}
                      {hasEvents && day.events.length > 1 && (
                        <div className="absolute top-1 right-1 w-1 h-1 bg-yellow-400 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
                
                {/* Dropdown positioned absolutely */}
                <DayActionDropdown
                  isOpen={dropdownOpen}
                  onOpenChange={setDropdownOpen}
                  onAddMedication={handleAddMedication}
                  selectedDate={selectedDate}
                />
              </div>
              
              {/* Legend */}
              <div className="flex justify-center gap-3 sm:gap-4 mt-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Consultas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded"></div>
                  <span>Medicamentos</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Medication Dialog */}
      {showAddMedication && (
        <AddMedicationDialog 
          onAdd={createMedication} 
          isLoading={medicationSubmitting}
          onClose={() => setShowAddMedication(false)}
        />
      )}
    </>
  );
};

export default MonthlyCalendar;
