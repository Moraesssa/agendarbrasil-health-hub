
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AgendaPageHeaderProps {
  canSave: boolean;
  isDirty: boolean;
  hasCompleteBlocks?: boolean;
}

export const AgendaPageHeader = ({ canSave, isDirty, hasCompleteBlocks }: AgendaPageHeaderProps) => {
  const getStatusMessage = () => {
    if (!canSave) {
      return "• Preencha pelo menos um campo de qualquer bloco para habilitar o salvamento";
    }
    
    if (isDirty && canSave && hasCompleteBlocks) {
      return "• Pronto para salvar";
    }
    
    if (isDirty && canSave && !hasCompleteBlocks) {
      return "• Ative e complete pelo menos um bloco para salvar com sucesso";
    }
    
    return "";
  };

  const getStatusColor = () => {
    if (!canSave) return "text-amber-600";
    if (hasCompleteBlocks) return "text-green-600 animate-pulse";
    return "text-blue-600";
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-white/95 px-6">
      <SidebarTrigger />
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-800">Meus Horários</h1>
        <p className="text-sm text-gray-600">
          Defina sua disponibilidade e locais para cada dia da semana.
          {getStatusMessage() && (
            <span className={`ml-2 font-medium ${getStatusColor()}`}>
              {getStatusMessage()}
            </span>
          )}
        </p>
      </div>
    </header>
  );
};
