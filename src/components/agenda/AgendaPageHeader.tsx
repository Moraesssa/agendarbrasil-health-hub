
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AgendaPageHeaderProps {
  canSave: boolean;
  isDirty: boolean;
}

export const AgendaPageHeader = ({ canSave, isDirty }: AgendaPageHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-white/95 px-6">
      <SidebarTrigger />
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-800">Meus Horários</h1>
        <p className="text-sm text-gray-600">
          Defina sua disponibilidade e locais para cada dia da semana.
          {!canSave && <span className="ml-2 text-amber-600 font-medium">• Configure pelo menos um bloco válido para salvar</span>}
          {isDirty && canSave && <span className="ml-2 text-green-600 font-medium animate-pulse">• Pronto para salvar</span>}
        </p>
      </div>
    </header>
  );
};
