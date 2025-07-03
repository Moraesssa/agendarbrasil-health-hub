
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { FamilyMember } from "@/types/family";

interface FamilyMemberSelectProps {
  familyMembers: FamilyMember[];
  selectedMemberId: string;
  currentUserId: string;
  currentUserName: string;
  isLoading?: boolean;
  onChange: (memberId: string) => void;
  disabled?: boolean;
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
  disabled = false
}: FamilyMemberSelectProps) => {
  // Filter family members who can have appointments scheduled for them
  const availableMembers = familyMembers.filter(member => 
    member.status === 'active'
  );

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">
        Para quem deseja agendar
      </Label>
      <Select
        value={selectedMemberId}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione para quem agendar" />
        </SelectTrigger>
        <SelectContent>
          {/* Current user option */}
          <SelectItem value={currentUserId}>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <div>
                <div className="font-medium">Eu mesmo</div>
                <div className="text-xs text-muted-foreground">{currentUserName}</div>
              </div>
            </div>
          </SelectItem>
          
          {/* Family members options */}
          {availableMembers.map((member) => (
            <SelectItem key={member.id} value={member.family_member_id}>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <div>
                  <div className="font-medium">{member.display_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {relationshipLabels[member.relationship]} • {member.email}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {availableMembers.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum membro da família disponível. Adicione membros em "Gerenciar Família".
        </p>
      )}
    </div>
  );
};
