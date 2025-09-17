import { Button } from "@/components/ui/button";
import { UnsavedChangesOverlay } from "@/components/ui/UnsavedChangesOverlay";
import { Loader2, Save, Undo2 } from "lucide-react";

interface AgendaFormActionsProps {
  isDirty: boolean;
  canSave: boolean;
  isSubmitting: boolean;
  onUndo: () => void;
}

export const AgendaFormActions = ({ isDirty, canSave, isSubmitting, onUndo }: AgendaFormActionsProps) => {
  const showOverlay = isDirty && !isSubmitting;

  return (
    <div className="relative">
      <UnsavedChangesOverlay
        isDirty={showOverlay}
        canSave={canSave}
        isSubmitting={isSubmitting}
        onUndo={onUndo}
        description="Você precisa salvar ou desfazer para continuar editando a agenda."
        saveLabel="Salvar alterações"
      />
      <div className="flex items-center justify-end gap-4 pt-4 mt-6 border-t">
        {isDirty && (
          <Button type="button" variant="ghost" onClick={onUndo} disabled={isSubmitting}>
            <Undo2 className="w-4 h-4 mr-2" /> Desfazer
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !canSave}>
          {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};
