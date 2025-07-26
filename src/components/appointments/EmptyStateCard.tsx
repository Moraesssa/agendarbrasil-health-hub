
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateCardProps {
  message?: string;
  description?: string;
  onSchedule: () => void;
}

const EmptyStateCard = ({ 
  message = "Sua agenda está livre! 📅",
  description = "Que tal agendar sua primeira consulta? É rápido, fácil e você pode escolher o melhor horário para você.",
  onSchedule 
}: EmptyStateCardProps) => (
  <div className="text-center py-8 sm:py-12 px-4 sm:px-6">
    {/* Large Calendar Icon with Gradient Background */}
    <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
      <CalendarPlus className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 text-blue-600" />
    </div>
    
    {/* Friendly Title */}
    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
      {message}
    </h3>
    
    {/* Subtitle */}
    <p className="text-gray-600 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
      {description}
    </p>
    
    {/* Prominent CTA Button */}
    <Button 
      onClick={onSchedule}
      size="lg"
      className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
    >
      <CalendarPlus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
      Agendar sua primeira consulta
    </Button>
    
    {/* Additional helpful text */}
    <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
      ✨ Encontre especialistas qualificados e horários que se encaixem na sua rotina
    </p>
  </div>
);

export default EmptyStateCard;
