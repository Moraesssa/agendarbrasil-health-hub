import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Save, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnsavedChangesOverlayProps {
  isDirty: boolean;
  canSave: boolean;
  isSubmitting?: boolean;
  onSave?: () => void;
  onUndo?: () => void;
  title?: string;
  description?: string;
  saveLabel?: string;
  undoLabel?: string;
  className?: string;
}

export const UnsavedChangesOverlay = ({
  isDirty,
  canSave,
  isSubmitting = false,
  onSave,
  onUndo,
  title = "Alterações não salvas",
  description = "Você possui alterações que precisam ser salvas antes de continuar.",
  saveLabel = "Salvar",
  undoLabel = "Desfazer",
  className,
}: UnsavedChangesOverlayProps) => {
  if (!isDirty) {
    return null;
  }

  const handleSaveClick = () => {
    if (onSave) {
      onSave();
    }
  };

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center", className)} role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md mx-4 space-y-4 rounded-xl border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          {title}
        </div>
        <p className="text-sm text-muted-foreground text-center">{description}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {onUndo && (
            <Button
              type="button"
              variant="outline"
              onClick={onUndo}
              className="sm:flex-1"
              disabled={isSubmitting}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              {undoLabel}
            </Button>
          )}
          <Button
            type={onSave ? "button" : "submit"}
            onClick={onSave ? handleSaveClick : undefined}
            disabled={!canSave || isSubmitting}
            className="sm:flex-1"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
