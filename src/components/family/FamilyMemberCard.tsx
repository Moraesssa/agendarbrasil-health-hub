
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { User, MoreHorizontal, Edit, Trash2, Calendar, Eye, X } from 'lucide-react';
import { FamilyMember } from '@/types/family';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onUpdate: (memberId: string, updates: Partial<FamilyMember>) => Promise<boolean>;
  onRemove: (memberId: string) => Promise<boolean>;
  isSubmitting?: boolean;
}

const relationshipLabels = {
  spouse: 'Cônjuge',
  child: 'Filho(a)',
  parent: 'Pai/Mãe',
  sibling: 'Irmão/Irmã',
  other: 'Outro'
};

const permissionLabels = {
  admin: 'Administrador',
  manager: 'Gerenciador',
  viewer: 'Visualizador'
};

const getPermissionColor = (level: string) => {
  switch (level) {
    case 'admin': return 'bg-red-100 text-red-800';
    case 'manager': return 'bg-blue-100 text-blue-800';
    case 'viewer': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const FamilyMemberCard = ({ 
  member, 
  onUpdate, 
  onRemove, 
  isSubmitting = false 
}: FamilyMemberCardProps) => {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleRemove = async () => {
    const success = await onRemove(member.id);
    if (success) {
      setShowDeleteAlert(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            {member.display_name}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => setShowDeleteAlert(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Relacionamento:</span>
              <span className="text-sm font-medium">
                {relationshipLabels[member.relationship]}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Permissão:</span>
              <Badge className={getPermissionColor(member.permission_level)}>
                {permissionLabels[member.permission_level]}
              </Badge>
            </div>

            <div className="pt-2 border-t">
              <div className="flex flex-wrap gap-2">
                {member.can_schedule && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    Agendar
                  </Badge>
                )}
                {member.can_view_history && (
                  <Badge variant="outline" className="text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    Histórico
                  </Badge>
                )}
                {member.can_cancel && (
                  <Badge variant="outline" className="text-xs">
                    <X className="w-3 h-3 mr-1" />
                    Cancelar
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              {member.email}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro da família</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {member.display_name} da sua família? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemove}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
