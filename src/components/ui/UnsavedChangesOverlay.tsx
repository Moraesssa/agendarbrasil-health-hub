import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Save, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnsavedChangesOverlayProps {
  isDirty: boolean;
  canSave: boolean;
  isSubmitting?: boolean;
  onSave?: () => void;
  onUndo?: () => void;
  open?: boolean;
  onDismiss?: () => void;
  title?: string;
  description?: string;
  saveLabel?: string;
  undoLabel?: string;
  dismissLabel?: string;
  className?: string;
}

export const UnsavedChangesOverlay = ({
  isDirty,
  canSave,
  isSubmitting = false,
  onSave,
  onUndo,
  open,
  onDismiss,
  title = "Alterações não salvas",
  description = "Você possui alterações que precisam ser salvas antes de continuar.",
  saveLabel = "Salvar",
  undoLabel = "Desfazer",
  dismissLabel = "Continuar editando",
  className,
}: UnsavedChangesOverlayProps) => {
  const shouldRender = (open ?? isDirty) && isDirty;

  if (!shouldRender) {
    return null;
  }

  const handleSaveClick = () => {
    if (onSave) {
      onSave();
    }
  };

  return (
    <div
      className={cn(
        "relative z-40 mx-auto mb-4 flex w-full max-w-lg justify-center px-4",
        className
      )}
      role="alert"
      aria-live="assertive"
      data-testid="unsaved-changes-overlay"
    >
      <div className="w-full space-y-4 rounded-xl border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          {title}
        </div>
        <p className="text-sm text-muted-foreground text-center">{description}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {onDismiss && (
            <Button
              type="button"
              variant="ghost"
              onClick={onDismiss}
              className="sm:flex-1"
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              {dismissLabel}
            </Button>
          )}
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
