import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UnsavedChangesOverlay } from "@/components/ui/UnsavedChangesOverlay";
import { AlertTriangle, Loader2, Save, Undo2 } from "lucide-react";

interface AgendaFormActionsProps {
  hasChanges: boolean;
  canSave: boolean;
  isSubmitting: boolean;
  onUndo: () => void;
}

export const AgendaFormActions = ({ hasChanges, canSave, isSubmitting, onUndo }: AgendaFormActionsProps) => {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"undo" | null>(null);

  useEffect(() => {
    if (!hasChanges || isSubmitting) {
      setOverlayOpen(false);
      setPendingAction(null);
    }
  }, [hasChanges, isSubmitting]);

  const handleRequestUndo = () => {
    if (!hasChanges || isSubmitting) {
      return;
    }

    setPendingAction("undo");
    setOverlayOpen(true);
  };

  const handleDismissOverlay = () => {
    setOverlayOpen(false);
    setPendingAction(null);
  };

  const handleConfirmUndo = () => {
    onUndo();
    handleDismissOverlay();
  };

  return (
    <div className="relative">
      {hasChanges && (
        <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <div>
            <AlertTitle>Alterações em andamento</AlertTitle>
            <AlertDescription>
              Continue editando normalmente e clique em &quot;Salvar alterações&quot; quando terminar.
            </AlertDescription>
          </div>
        </Alert>
      )}
      <UnsavedChangesOverlay
        isDirty={hasChanges}
        open={overlayOpen}
        canSave={canSave}
        isSubmitting={isSubmitting}
        onUndo={pendingAction === "undo" ? handleConfirmUndo : undefined}
        onDismiss={handleDismissOverlay}
        description="Você precisa salvar ou desfazer para continuar editando a agenda."
        saveLabel="Salvar alterações"
        undoLabel="Desfazer alterações"
      />
      <div className="flex items-center justify-end gap-4 pt-4 mt-6 border-t">
        {hasChanges && (
          <Button type="button" variant="ghost" onClick={handleRequestUndo} disabled={isSubmitting}>
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
