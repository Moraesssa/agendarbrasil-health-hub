import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User, Users, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { FamilyMember } from "@/types/family";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { FieldValidation, ValidationError } from "./FieldValidation";
import { InlineSuccess } from "./SuccessAnimation";

interface FamilyMemberSelectProps {
  familyMembers: FamilyMember[];
  selectedMemberId: string;
  currentUserId: string;
  currentUserName: string;
  isLoading?: boolean;
  onChange: (memberId: string) => void;
  disabled?: boolean;
  error?: ValidationError;
  showSuccess?: boolean;
}

const relationshipLabels = {
  spouse: 'Cônjuge',
  child: 'Filho(a)',
  parent: 'Pai/Mãe',
  sibling: 'Irmão/Irmã',
  other: 'Outro'
};

export const FamilyMemberSelect = ({
  familyMembers,
  selectedMemberId,
  currentUserId,
  currentUserName,
  isLoading = false,
  onChange,
  disabled = false,
  error,
  showSuccess = false
}: FamilyMemberSelectProps) => {
  // Filter family members who can have appointments scheduled for them
  const availableMembers = familyMembers.filter(member => 
    member.status === 'active'
  );

  // Get selected member info for display
  const selectedMember = selectedMemberId === currentUserId 
    ? { name: currentUserName, isCurrentUser: true }
    : availableMembers.find(member => member.family_member_id === selectedMemberId);

  // Show loading skeleton while loading
  if (isLoading) {
    return <LoadingSkeleton variant="card" lines={2} className="family-selection-highlight border-2 border-green-500" />;
  }

  return (
    <Card 
      className="family-selection-highlight border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg"
      role="region"
      aria-labelledby="family-member-heading"
      aria-describedby="family-member-description"
    >
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0" aria-hidden="true">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 
              id="family-member-heading"
              className="text-lg sm:text-xl font-semibold text-green-800"
            >
              Agendar para
            </h3>
            <p 
              id="family-member-description"
              className="text-xs sm:text-sm text-green-600 leading-tight"
            >
              Selecione para quem você está agendando esta consulta
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Current Selection Display */}
        {selectedMemberId && (
          <div 
            className="p-3 bg-white rounded-lg border border-green-200 shadow-sm"
            role="status"
            aria-live="polite"
            aria-label={`Selecionado para agendamento: ${'isCurrentUser' in (selectedMember || {}) ? 'Você mesmo' : (selectedMember as any)?.name || 'Selecionado'}`}
          >
            <div className="flex items-start sm:items-center space-x-3">
              <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base leading-tight">
                  Agendando para: {'isCurrentUser' in (selectedMember || {}) ? 'Você mesmo' : (selectedMember as any)?.name || 'Selecionado'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {'isCurrentUser' in (selectedMember || {}) ? currentUserName : 'Membro da família'}
                </p>
              </div>
              {showSuccess && (
                <InlineSuccess show={true} message="Selecionado" />
              )}
            </div>
          </div>
        )}

        {/* Selection Interface */}
        <div className="space-y-2 sm:space-y-3">
          <Label 
            className="flex items-center gap-2 text-sm sm:text-base font-medium text-gray-800"
            htmlFor="family-member-select"
          >
            <Users className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>Escolha uma opção:</span>
          </Label>
          
          <Select
            value={selectedMemberId}
            onValueChange={onChange}
            disabled={disabled || isLoading}
          >
            <SelectTrigger 
              id="family-member-select"
              className={`h-11 sm:h-12 bg-white border-2 transition-colors touch-manipulation focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none ${
                error 
                  ? 'border-red-300 animate-pulse-error focus:border-red-500' 
                  : 'border-green-200 hover:border-green-300 focus:border-green-500'
              }`}
              aria-label="Selecionar pessoa para agendamento"
              aria-describedby={error ? "family-member-error" : "family-member-description"}
              aria-invalid={!!error}
              aria-required="true"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Carregando opções...</span>
                </div>
              ) : (
                <SelectValue placeholder="👤 Toque aqui para selecionar" />
              )}
            </SelectTrigger>
            <SelectContent 
              className="bg-white max-h-[60vh] overflow-y-auto"
              role="listbox"
              aria-label="Opções de pessoas para agendamento"
            >
              {/* Current user option */}
              <SelectItem 
                value={currentUserId} 
                className="p-3 sm:p-4 hover:bg-green-50 focus:bg-green-50 touch-manipulation min-h-[60px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                aria-label={`Agendar para você mesmo: ${currentUserName}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full flex-shrink-0" aria-hidden="true">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">Eu mesmo</div>
                    <div className="text-xs sm:text-sm text-gray-600 truncate">{currentUserName}</div>
                  </div>
                </div>
              </SelectItem>
              
              {/* Family members options */}
              {availableMembers.map((member) => (
                <SelectItem 
                  key={member.id} 
                  value={member.family_member_id} 
                  className="p-3 sm:p-4 hover:bg-green-50 focus:bg-green-50 touch-manipulation min-h-[60px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                  aria-label={`Agendar para ${member.display_name}, ${relationshipLabels[member.relationship]}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full flex-shrink-0" aria-hidden="true">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{member.display_name}</div>
                      <div className="text-xs sm:text-sm text-gray-600 truncate">
                        {relationshipLabels[member.relationship]} • {member.email}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Help text or empty state */}
        {availableMembers.length === 0 ? (
          <div 
            className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-amber-800">Apenas você pode agendar</p>
              <p className="text-xs sm:text-sm text-amber-700 mt-1 leading-tight">
                Para agendar para familiares, adicione-os em "Gerenciar Família".
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center px-2" role="note" aria-label="Dica sobre seleção de familiar">
            <p className="text-xs sm:text-sm text-gray-600 leading-tight">
              💡 Você pode agendar para si mesmo ou para qualquer membro da sua família
            </p>
          </div>
        )}
        
        {/* Error Display */}
        <FieldValidation error={error} success={showSuccess && !!selectedMemberId} />
      </CardContent>
    </Card>
  );
};